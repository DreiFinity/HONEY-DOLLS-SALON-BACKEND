import { pool } from "../../db/index.js";

export default class CustomerPaymentOrderRepositoryImpl {
  /**
   * Get ALL payment orders with nested orders + orderdetails + product/service info
   */
  async getAllPaymentOrders() {
    const result = await pool.query(`
      SELECT
        cp.customerpaymentid,
        cp.reference_code,
        cp.method,
        cp.status AS payment_status,
        cp.currency,
        cp.checkout_url,
        cp.paymongo_id,
        cp.delivery_fee,
        cp.updated_at AS payment_date,
        cp.customerid,
        c.firstname AS customer_firstname,
        c.lastname AS customer_lastname,
        c.contact AS customer_contact,
        o.orderid,
        o.status AS order_status,
        o.order_channel,
        o.createdat AS order_created,
        o.shipping_street,
        o.shipping_barangay,
        o.shipping_city,
        o.shipping_province,
        o.shipping_postal_code,
        o.courier_name,
        o.tracking_number,
        o.estimated_delivery_date,
        o.shipped_at,
        o.delivered_at,
        od.orderdetailsid,
        od.quantity,
        od.unit_price,
        od.productid,
        od.serviceid,
        p.prodname,
        p.prodcat,
        p.prodimage

      FROM customerpayment cp
      LEFT JOIN customers c ON c.customerid = cp.customerid
      LEFT JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      LEFT JOIN orders o ON o.orderid = cpo.orderid
      LEFT JOIN orderdetails od ON od.orderid = o.orderid

      LEFT JOIN products p ON p.productid = od.productid
     
      ORDER BY cp.updated_at DESC, o.orderid ASC, od.orderdetailsid ASC
    `);

    return this._nestPaymentOrders(result.rows);
  }

  /**
   * Get a single payment with its orders + orderdetails by customerpaymentid
   */
  async getPaymentOrderById(customerpaymentid) {
    const result = await pool.query(
      `
      SELECT
        cp.customerpaymentid,
        cp.reference_code,
        cp.method,
        cp.status AS payment_status,
        cp.currency,
        cp.checkout_url,
        cp.paymongo_id,
        cp.delivery_fee,
        cp.updated_at AS payment_date,
        cp.customerid,
        c.firstname AS customer_firstname,
        c.lastname AS customer_lastname,
        c.contact AS customer_contact,
        o.orderid,
        o.status AS order_status,
        o.order_channel,
        o.createdat AS order_created,
        o.shipping_street,
        o.shipping_barangay,
        o.shipping_city,
        o.shipping_province,
        o.shipping_postal_code,
        o.courier_name,
        o.tracking_number,
        o.estimated_delivery_date,
        o.shipped_at,
        o.delivered_at,
        od.orderdetailsid,
        od.quantity,
        od.unit_price,
        od.productid,
        od.serviceid,
        p.prodname,
        p.prodcat,
        p.prodimage,
        s.servicename,
        s.price AS service_price
      FROM customerpayment cp
      LEFT JOIN customers c ON c.customerid = cp.customerid
      LEFT JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      LEFT JOIN orders o ON o.orderid = cpo.orderid
      LEFT JOIN orderdetails od ON od.orderid = o.orderid
      LEFT JOIN products p ON p.productid = od.productid
      LEFT JOIN service s ON s.serviceid = od.serviceid
      WHERE cp.customerpaymentid = $1
      ORDER BY o.orderid ASC, od.orderdetailsid ASC
    `,
      [customerpaymentid],
    );

    const nested = this._nestPaymentOrders(result.rows);
    return nested.length > 0 ? nested[0] : null;
  }

  /**
   * Get all payment orders for a specific customer
   */
  async getPaymentOrdersByCustomerId(customerid) {
    const result = await pool.query(
      `
      SELECT
        cp.customerpaymentid,
        cp.reference_code,
        cp.method,
        cp.status AS payment_status,
        cp.currency,
        cp.checkout_url,
        cp.paymongo_id,
        cp.delivery_fee,
        cp.updated_at AS payment_date,
        cp.customerid,
        c.firstname AS customer_firstname,
        c.lastname AS customer_lastname,
        c.contact AS customer_contact,
        o.orderid,
        o.status AS order_status,
        o.order_channel,
        o.createdat AS order_created,
        o.shipping_street,
        o.shipping_barangay,
        o.shipping_city,
        o.shipping_province,
        o.shipping_postal_code,
        o.courier_name,
        o.tracking_number,
        o.estimated_delivery_date,
        o.shipped_at,
        o.delivered_at,
        od.orderdetailsid,
        od.quantity,
        od.unit_price,
        od.productid,
        od.serviceid,
        p.prodname,
        p.prodcat,
        p.prodimage,
        s.servicename,
        s.price AS service_price
      FROM customerpayment cp
      LEFT JOIN customers c ON c.customerid = cp.customerid
      LEFT JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      LEFT JOIN orders o ON o.orderid = cpo.orderid
      LEFT JOIN orderdetails od ON od.orderid = o.orderid
      LEFT JOIN products p ON p.productid = od.productid
      LEFT JOIN service s ON s.serviceid = od.serviceid
      WHERE cp.customerid = $1
      ORDER BY cp.updated_at DESC, o.orderid ASC, od.orderdetailsid ASC
    `,
      [customerid],
    );

    return this._nestPaymentOrders(result.rows);
  }

  /**
   * Get payment orders filtered by payment status (pending, paid, etc.)
   */
  async getPaymentOrdersByStatus(status) {
    const result = await pool.query(
      `
      SELECT
        cp.customerpaymentid,
        cp.reference_code,
        cp.method,
        cp.status AS payment_status,
        cp.currency,
        cp.checkout_url,
        cp.paymongo_id,
        cp.delivery_fee,
        cp.updated_at AS payment_date,
        cp.customerid,
        c.firstname AS customer_firstname,
        c.lastname AS customer_lastname,
        c.contact AS customer_contact,
        o.orderid,
        o.status AS order_status,
        o.order_channel,
        o.createdat AS order_created,
        o.shipping_street,
        o.shipping_barangay,
        o.shipping_city,
        o.shipping_province,
        o.shipping_postal_code,
        o.courier_name,
        o.tracking_number,
        o.estimated_delivery_date,
        o.shipped_at,
        o.delivered_at,
        od.orderdetailsid,
        od.quantity,
        od.unit_price,
        od.productid,
        od.serviceid,
        p.prodname,
        p.prodcat,
        p.prodimage,
        s.servicename,
        s.price AS service_price
      FROM customerpayment cp
      LEFT JOIN customers c ON c.customerid = cp.customerid
      LEFT JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
      LEFT JOIN orders o ON o.orderid = cpo.orderid
      LEFT JOIN orderdetails od ON od.orderid = o.orderid
      LEFT JOIN products p ON p.productid = od.productid
      LEFT JOIN service s ON s.serviceid = od.serviceid
      WHERE cp.status = $1
      ORDER BY cp.updated_at DESC, o.orderid ASC, od.orderdetailsid ASC
    `,
      [status],
    );

    return this._nestPaymentOrders(result.rows);
  }

  /**
   * Update tracking number for all orders linked to a customerpayment.
   * Sets shipped_at = NOW(), status = 'shipping' on each order.
   */
  async updateTrackingNumber(customerpaymentid, tracking_number) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update all linked orders: tracking_number, shipped_at, status → shipping
      const result = await client.query(
        `UPDATE orders o
         SET tracking_number = $1,
             shipped_at = CURRENT_TIMESTAMP,
             status = 'shipping',
             updatedat = CURRENT_TIMESTAMP
         FROM customerpayment_orders cpo
         WHERE o.orderid = cpo.orderid
           AND cpo.customerpaymentid = $2
         RETURNING o.*`,
        [tracking_number, customerpaymentid],
      );

      if (result.rowCount === 0) {
        throw new Error(
          `No orders found for payment ID ${customerpaymentid}`,
        );
      }

      await client.query("COMMIT");
      return result.rows;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Mark all orders linked to a customerpayment as delivered.
   * Sets delivered_at = NOW(), status = 'delivered'.
   */
  async markOrdersDelivered(customerpaymentid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE orders o
         SET delivered_at = CURRENT_TIMESTAMP,
             status = 'delivered',
             updatedat = CURRENT_TIMESTAMP
         FROM customerpayment_orders cpo
         WHERE o.orderid = cpo.orderid
           AND cpo.customerpaymentid = $1
         RETURNING o.*`,
        [customerpaymentid],
      );

      if (result.rowCount === 0) {
        throw new Error(
          `No orders found for payment ID ${customerpaymentid}`,
        );
      }

      await client.query("COMMIT");
      return result.rows;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Transforms flat SQL rows into nested payment → orders → orderdetails structure
   */
  _nestPaymentOrders(rows) {
    const paymentsMap = new Map();

    for (const row of rows) {
      // --- Payment level ---
      if (!paymentsMap.has(row.customerpaymentid)) {
        paymentsMap.set(row.customerpaymentid, {
          customerpaymentid: row.customerpaymentid,
          reference_code: row.reference_code,
          method: row.method,
          payment_status: row.payment_status,
          currency: row.currency,
          checkout_url: row.checkout_url,
          paymongo_id: row.paymongo_id,
          delivery_fee: row.delivery_fee,
          payment_date: row.payment_date,
          customer: {
            customerid: row.customerid,
            firstname: row.customer_firstname,
            lastname: row.customer_lastname,
            contact: row.customer_contact,
          },
          orders: [],
          _ordersMap: new Map(),
        });
      }

      const payment = paymentsMap.get(row.customerpaymentid);

      // --- Order level ---
      if (row.orderid && !payment._ordersMap.has(row.orderid)) {
        const order = {
          orderid: row.orderid,
          order_status: row.order_status,
          order_channel: row.order_channel,
          order_created: row.order_created,
          shipping_street: row.shipping_street,
          shipping_barangay: row.shipping_barangay,
          shipping_city: row.shipping_city,
          shipping_province: row.shipping_province,
          shipping_postal_code: row.shipping_postal_code,
          courier_name: row.courier_name,
          tracking_number: row.tracking_number,
          estimated_delivery_date: row.estimated_delivery_date,
          shipped_at: row.shipped_at,
          delivered_at: row.delivered_at,
          orderdetails: [],
          _detailsSet: new Set(),
        };
        payment._ordersMap.set(row.orderid, order);
        payment.orders.push(order);
      }

      // --- OrderDetails level ---
      if (row.orderid && row.orderdetailsid) {
        const order = payment._ordersMap.get(row.orderid);
        if (order && !order._detailsSet.has(row.orderdetailsid)) {
          order._detailsSet.add(row.orderdetailsid);
          order.orderdetails.push({
            orderdetailsid: row.orderdetailsid,
            quantity: row.quantity,
            unit_price: row.unit_price,
            product: row.productid
              ? {
                productid: row.productid,
                prodname: row.prodname,
                prodcat: row.prodcat,
                prodimage: row.prodimage,
              }
              : null,
            service: row.serviceid
              ? {
                serviceid: row.serviceid,
                servicename: row.servicename,
                price: row.service_price,
              }
              : null,
          });
        }
      }
    }

    // Clean up internal tracking maps/sets before returning
    const payments = Array.from(paymentsMap.values());
    for (const payment of payments) {
      delete payment._ordersMap;
      for (const order of payment.orders) {
        delete order._detailsSet;
      }
    }

    return payments;
  }
}
