import { pool } from "../../db/index.js";

export default class OnlineOrderRepositoryImpl {
  async create(orderData) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1️⃣ Insert into orders
      const orderRes = await client.query(
        `INSERT INTO orders(
          customerid, order_channel, status 
                
        ) VALUES ($1,$2,$3)
        RETURNING *`,
        [
          orderData.customerid,
          orderData.order_channel || "online",
          orderData.status || "pending",
        ],
      );

      const order = orderRes.rows[0];

      // 2️⃣ Insert products into orderdetails
      for (const item of orderData.products) {
        const productRes = await client.query(
          "SELECT price FROM products WHERE productid = $1",
          [item.productid],
        );

        if (!productRes.rows[0])
          throw new Error(`Product ${item.productid} not found`);

        const unit_price = productRes.rows[0].price;

        await client.query(
          `INSERT INTO orderdetails(orderid, productid, quantity, unit_price)
           VALUES ($1,$2,$3,$4)`,
          [order.orderid, item.productid, item.quantity, unit_price],
        );
      }

      await client.query("COMMIT");

      return order;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getPendingOrdersByCustomer(customerid) {
    const query = `
      SELECT 
        o.orderid,
        o.customerid,
        o.createdat,
        o.status,
        od.orderdetailsid,
        od.quantity,
        od.unit_price,
        p.productid,
        p.prodname,
        p.prodcat,
        p.prodimage
      FROM orders o
      LEFT JOIN orderdetails od ON o.orderid = od.orderid
      LEFT JOIN products p ON od.productid = p.productid
      WHERE o.customerid = $1
        AND o.status = 'pending'
      ORDER BY o.createdat DESC
    `;
    const { rows } = await pool.query(query, [customerid]);

    const ordersMap = {};

    rows.forEach((row) => {
      if (!ordersMap[row.orderid]) {
        ordersMap[row.orderid] = {
          orderid: row.orderid,
          customerid: row.customerid,
          createdat: row.createdat,
          status: row.status,
          products: [],
        };
      }

      if (row.productid) {
        ordersMap[row.orderid].products.push({
          productid: row.productid,
          prodname: row.prodname,
          prodcat: row.prodcat,
          prodimage: row.prodimage,
          quantity: row.quantity,
          unit_price: row.unit_price,
        });
      }
    });

    return Object.values(ordersMap);
  }

  // Get single order by id (including products)
  async findById(orderid) {
    const orderRes = await pool.query(
      "SELECT * FROM orders WHERE orderid = $1",
      [orderid],
    );
    const order = orderRes.rows[0];
    if (!order) return null;

    const detailsRes = await pool.query(
      `SELECT od.orderdetailsid, od.productid, od.quantity, od.unit_price,
              p.prodname, p.prodcat, p.prodimage
       FROM orderdetails od
       JOIN products p ON od.productid = p.productid
       WHERE od.orderid = $1`,
      [orderid],
    );

    order.products = detailsRes.rows;
    return order;
  }

  // Get all orders (or by customer)
  async findByCustomer(customerid) {
    const ordersRes = await pool.query(
      "SELECT * FROM orders WHERE customerid = $1 ORDER BY createdat DESC",
      [customerid],
    );
    const orders = [];

    for (const order of ordersRes.rows) {
      const detailsRes = await pool.query(
        `SELECT od.orderdetailsid, od.productid, od.quantity, od.unit_price,
                p.prodname, p.prodcat, p.prodimage
         FROM orderdetails od
         JOIN products p ON od.productid = p.productid
         WHERE od.orderid = $1`,
        [order.orderid],
      );
      order.products = detailsRes.rows;
      orders.push(order);
    }

    return orders;
  }

  // Get all orders (admin view)
  async findAll() {
    const ordersRes = await pool.query(
      "SELECT * FROM orders ORDER BY createdat DESC",
    );
    const orders = [];

    for (const order of ordersRes.rows) {
      const detailsRes = await pool.query(
        `SELECT od.orderdetailsid, od.productid, od.quantity, od.unit_price,
                p.prodname, p.prodcat, p.prodimage
         FROM orderdetails od
         JOIN products p ON od.productid = p.productid
         WHERE od.orderid = $1`,
        [order.orderid],
      );
      order.products = detailsRes.rows;
      orders.push(order);
    }

    return orders;
  }

  // Update order (only orders table, not details for simplicity)
  async update(orderid, updateData) {
    const fields = [];
    const values = [];
    let i = 1;

    for (const key in updateData) {
      fields.push(`${key} = $${i}`);
      values.push(updateData[key]);
      i++;
    }
    values.push(orderid);

    const query = `UPDATE orders SET ${fields.join(", ")}, updatedat = NOW() WHERE orderid = $${i} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  // Update order quantity in orderdetails
  async updateQuantity(orderid, productid, newQuantity) {
    const query = `
      UPDATE orderdetails 
      SET quantity = $1 
      WHERE orderid = $2 AND productid = $3 
      RETURNING *
    `;
    const res = await pool.query(query, [newQuantity, orderid, productid]);
    return res.rows[0];
  }

  // Delete order + orderdetails
  async delete(orderid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM orderdetails WHERE orderid = $1", [
        orderid,
      ]);
      const res = await client.query(
        "DELETE FROM orders WHERE orderid = $1 RETURNING *",
        [orderid],
      );

      await client.query("COMMIT");
      return res.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
