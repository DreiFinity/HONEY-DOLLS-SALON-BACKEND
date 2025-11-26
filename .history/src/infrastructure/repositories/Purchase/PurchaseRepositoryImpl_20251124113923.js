import { pool } from "../../db/index.js";
import PurchaseOrderRepository from "../../../domain/repositories/PurchaseOrderRepository.js";

export default class PurchaseOrderRepositoryImpl extends PurchaseOrderRepository {
  async createPurchaseWithDetails(orderData, items) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert Purchase Order
      const orderQuery = `
        INSERT INTO purchaseorder (purchaseid, supplierid, status, branchid, dateordered)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;

      const orderValues = [
        orderData.purchaseid,
        orderData.supplierid,
        orderData.status,
        orderData.branchid,
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const purchaseOrder = orderResult.rows[0];

      // Insert Details
      const details = [];

      for (const item of items) {
        const detailQuery = `
          INSERT INTO purchaseorderdetails 
          (purchasedetailid, purchaseid, productid, unit_price, quantity)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const detailValues = [
          item.purchasedetailid,
          purchaseOrder.purchaseid,
          item.productid,
          item.unit_price,
          item.quantity,
        ];

        const detailResult = await client.query(detailQuery, detailValues);
        details.push(detailResult.rows[0]);
      }

      await client.query("COMMIT");

      return { purchaseOrder, details };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
