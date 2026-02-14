import { pool } from "../../../infrastructure/db/index.js";

export class PostgresOrderRepository {
  async create(orderData, details, userId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1️⃣ Get customerid from customers table
      const custResult = await client.query(
        "SELECT customerid FROM customers WHERE userid = $1",
        [userId]
      );

      if (!custResult.rows.length) {
        throw new Error("Customer not found for this user");
      }

      const customerid = custResult.rows[0].customerid;

      // 2️⃣ Insert main order
      const orderQuery = `
        INSERT INTO orders (customerid)
        VALUES ($1)
        RETURNING orderid
      `;
      const orderResult = await client.query(orderQuery, [
        customerid,
        orderData.total_amount,
      ]);
      const orderid = orderResult.rows[0].orderid;

      // 3️⃣ Insert order details
      for (const item of details) {
        const detailQuery = `
          INSERT INTO orderdetails (orderid, serviceid, productid, quantity, unit_price)
          VALUES ($1, $2, $3, $4, $5)
        `;
        await client.query(detailQuery, [
          orderid,
          item.serviceid,
          item.productid,
          item.quantity,
          item.unit_price,
        ]);
      }

      await client.query("COMMIT");
      return { orderid, message: "Order created successfully" };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
