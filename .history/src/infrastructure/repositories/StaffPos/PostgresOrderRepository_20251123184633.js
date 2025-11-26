// src/infrastructure/repositories/PostgresOrderRepository.js
import { pool } from "../../../infrastructure/db/index.js";

export class PostgresOrderRepository {
  async create(orderData, details, customerid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert main order
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

      // Insert order details
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
