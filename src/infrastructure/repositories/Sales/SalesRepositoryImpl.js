import { pool } from "../../db/index.js";

export default class SalesRepositoryImpl {
  async getDailyStats() {
    // Today's total sales (sum of unit_price * quantity for paid/delivered orders)
    const salesRes = await pool.query(`
      SELECT COALESCE(SUM(od.unit_price * od.quantity), 0) as total_sales
      FROM customerpayment cp
      JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      JOIN orders o ON o.orderid = cpo.orderid
      JOIN orderdetails od ON od.orderid = o.orderid
      WHERE (cp.status = 'paid' OR o.status = 'delivered')
        AND (cp.updated_at AT TIME ZONE 'Asia/Manila')::date = (NOW() AT TIME ZONE 'Asia/Manila')::date
    `);

    // Today's order count
    const ordersRes = await pool.query(`
      SELECT COUNT(DISTINCT o.orderid) as total_orders
      FROM orders o
      WHERE (o.createdat AT TIME ZONE 'Asia/Manila')::date = (NOW() AT TIME ZONE 'Asia/Manila')::date
    `);

    // Today's revenue (including delivery fees)
    const revenueRes = await pool.query(`
      SELECT COALESCE(SUM(od.unit_price * od.quantity), 0) + COALESCE(SUM(cp.delivery_fee), 0) as total_revenue
      FROM customerpayment cp
      JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      JOIN orders o ON o.orderid = cpo.orderid
      JOIN orderdetails od ON od.orderid = o.orderid
      WHERE (cp.status = 'paid' OR o.status = 'delivered')
        AND (cp.updated_at AT TIME ZONE 'Asia/Manila')::date = (NOW() AT TIME ZONE 'Asia/Manila')::date
    `);

    // Today's unique customer visitors (count customers with orders today)
    const visitorsRes = await pool.query(`
      SELECT COUNT(DISTINCT cp.customerid) as total_visitors
      FROM customerpayment cp
      WHERE (cp.updated_at AT TIME ZONE 'Asia/Manila')::date = (NOW() AT TIME ZONE 'Asia/Manila')::date
    `);

    return {
      todaySale: parseFloat(salesRes.rows[0].total_sales),
      todayOrders: parseInt(ordersRes.rows[0].total_orders),
      todayRevenue: parseFloat(revenueRes.rows[0].total_revenue),
      todayVisitors: parseInt(visitorsRes.rows[0].total_visitors)
    };
  }

  async getSalesChartData(days = 7) {
    const res = await pool.query(`
      SELECT 
        TO_CHAR(d.date, 'DD Mon') as day,
        COALESCE(SUM(od.unit_price * od.quantity), 0) as sales
      FROM (
        SELECT (CURRENT_DATE AT TIME ZONE 'Asia/Manila')::date - i as date
        FROM generate_series(0, $1) i
      ) d
      LEFT JOIN customerpayment cp ON (cp.updated_at AT TIME ZONE 'Asia/Manila')::date = d.date AND cp.status = 'paid'
      LEFT JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      LEFT JOIN orders o ON o.orderid = cpo.orderid
      LEFT JOIN orderdetails od ON od.orderid = o.orderid
      GROUP BY d.date
      ORDER BY d.date ASC
    `, [days - 1]);
    return res.rows;
  }

  async getTopProducts(limit = 6) {
    const res = await pool.query(`
      SELECT 
        p.prodname as name,
        p.productid as sku,
        SUM(od.quantity) as sold,
        SUM(od.unit_price * od.quantity) as total,
        p.price
      FROM orderdetails od
      JOIN products p ON p.productid = od.productid
      GROUP BY p.productid, p.prodname, p.price
      ORDER BY sold DESC
      LIMIT $1
    `, [limit]);
    return res.rows.map(row => ({
      ...row,
      sold: parseInt(row.sold),
      total: parseFloat(row.total),
      status: "Active" // Simplified status as stock is branch-specific
    }));
  }

  async getOrderStats(days = 7) {
    const res = await pool.query(`
      SELECT 
        TO_CHAR(d.date, 'DD Mon') as day,
        COUNT(DISTINCT o.orderid) as orders,
        COALESCE(SUM(od.unit_price * od.quantity), 0) as sales
      FROM (
        SELECT (CURRENT_DATE AT TIME ZONE 'Asia/Manila')::date - i as date
        FROM generate_series(0, $1) i
      ) d
      LEFT JOIN orders o ON (o.createdat AT TIME ZONE 'Asia/Manila')::date = d.date
      LEFT JOIN orderdetails od ON od.orderid = o.orderid
      GROUP BY d.date
      ORDER BY d.date ASC
    `, [days - 1]);
    return res.rows;
  }

  async getDashboardStats() {
    // 1. Overall Product Sales
    const productSalesRes = await pool.query(`
      SELECT COALESCE(SUM(od.unit_price * od.quantity), 0) as total
      FROM customerpayment cp
      JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      JOIN orders o ON o.orderid = cpo.orderid
      JOIN orderdetails od ON od.orderid = o.orderid
      WHERE cp.status = 'paid' OR o.status IN ('shipping', 'delivered', 'completed')
    `);

    // 2. Overall Service Revenue
    const serviceRevenueRes = await pool.query(`
      SELECT COALESCE(SUM(s.amount), 0) as total
      FROM appointment a
      JOIN appointmentservice aps ON a.appointmentid = aps.appointmentid
      JOIN service s ON s.serviceid = aps.serviceid
      WHERE a.status IN ('completed', 'paid')
    `);

    // 3. Total Customers
    const customerCountRes = await pool.query(`SELECT COUNT(*) FROM customers`);

    // 4. Total Staff
    const staffCountRes = await pool.query(`SELECT COUNT(*) FROM staff`);

    // 5. Monthly Revenue Trends (Last 6 Months)
    const monthlyTrendsRes = await pool.query(`
      SELECT 
        TO_CHAR(m.month, 'Mon') as month,
        COALESCE(
          (SELECT SUM(od2.unit_price * od2.quantity)
           FROM customerpayment cp2
           JOIN customerpayment_orders cpo2 ON cp2.customerpaymentid = cpo2.customerpaymentid
           JOIN orders o2 ON o2.orderid = cpo2.orderid
           JOIN orderdetails od2 ON od2.orderid = o2.orderid
           WHERE (cp2.status = 'paid' OR o2.status IN ('delivered', 'completed'))
             AND TO_CHAR(cp2.updated_at, 'Mon YYYY') = TO_CHAR(m.month, 'Mon YYYY')
          ), 0
        ) as product_sales,
        COALESCE(
          (SELECT SUM(s2.amount)
           FROM appointment a2
           JOIN appointmentservice aps2 ON a2.appointmentid = aps2.appointmentid
           JOIN service s2 ON s2.serviceid = aps2.serviceid
           WHERE a2.status IN ('completed', 'paid')
             AND TO_CHAR(a2.starttime, 'Mon YYYY') = TO_CHAR(m.month, 'Mon YYYY')
          ), 0
        ) as service_revenue
      FROM (
        SELECT DATE_TRUNC('month', CURRENT_DATE) - (i || ' month')::interval as month
        FROM generate_series(0, 5) i
      ) m
      ORDER BY m.month ASC
    `);

    return {
      totalProductSales: parseFloat(productSalesRes.rows[0].total),
      totalServiceRevenue: parseFloat(serviceRevenueRes.rows[0].total),
      totalCustomers: parseInt(customerCountRes.rows[0].count),
      totalStaff: parseInt(staffCountRes.rows[0].count),
      monthlyTrends: monthlyTrendsRes.rows
    };
  }
}
