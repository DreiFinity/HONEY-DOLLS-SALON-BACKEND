import { pool } from "../../db/index.js";

export default class PurchaseRepositoryImpl {
  async createPurchase(purchaseData) {
    const client = await pool.connect();

    const { supplierid, serviceid, branchid, status, details } = purchaseData;

    try {
      await client.query("BEGIN");

      // Insert purchase order
      const purchaseOrderQuery = `
        INSERT INTO purchaseorder (supplierid, serviceid, branchid, status, dateordered)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING purchaseid
      `;

      const orderResult = await client.query(purchaseOrderQuery, [
        supplierid,
        serviceid,
        branchid,
        status,
      ]);

      const purchaseid = orderResult.rows[0].purchaseid;

      // Insert each purchase detail
      for (const item of details) {
        const detailQuery = `
          INSERT INTO purchaseorderdetails (purchaseid, productid, unit_price, quantity)
          VALUES ($1, $2, $3, $4)
        `;

        await client.query(detailQuery, [
          purchaseid,
          item.productid,
          item.unit_price,
          item.quantity,
        ]);
      }

      await client.query("COMMIT");

      return { message: "Purchase order created", purchaseid };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getAllPurchases() {
    const query = `
      SELECT po.*, pod.*
      FROM purchaseorder po
      LEFT JOIN purchaseorderdetails pod
      ON po.purchaseid = pod.purchaseid
      ORDER BY po.purchaseid ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }
}
