import { pool } from "../../db/index.js";
import SupplierPurchaseRepository from "../../../domain/repositories/Purchase/SupplierPurchaseRepository.js";

export default class SupplierPurchaseRepositoryImpl extends SupplierPurchaseRepository {
  async create(purchaseData, items) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Master: supplierpurchase
      // Note: We use 'PENDING' as default status in code if not specified
      const orderQuery = `
        INSERT INTO supplierpurchase (supplierid, status, branchid)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const orderValues = [purchaseData.supplierid, purchaseData.status || "PENDING", purchaseData.branchid];
      const orderResult = await client.query(orderQuery, orderValues);
      const purchase = orderResult.rows[0];

      // 2. Insert Details: supplierpurchasedetails
      const details = [];
      for (const item of items) {
        const detailQuery = `
          INSERT INTO supplierpurchasedetails (purchaseid, productid, quantity)
          VALUES ($1, $2, $3)
          RETURNING *;
        `;
        const detailValues = [purchase.purchaseid, item.productid, item.quantity];
        const detailResult = await client.query(detailQuery, detailValues);
        details.push(detailResult.rows[0]);
      }

      await client.query("COMMIT");
      return { ...purchase, items: details };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findAll() {
    const query = `
      SELECT sp.*, s.suppliername
      FROM supplierpurchase sp
      JOIN supplier s ON sp.supplierid = s.supplierid
      ORDER BY sp.createdat DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async findById(purchaseid) {
    // Get master
    const orderQuery = `
      SELECT sp.*, s.suppliername
      FROM supplierpurchase sp
      JOIN supplier s ON sp.supplierid = s.supplierid
      WHERE sp.purchaseid = $1;
    `;
    const orderRes = await pool.query(orderQuery, [purchaseid]);
    if (orderRes.rows.length === 0) return null;

    // Get details
    const detailQuery = `
      SELECT spd.*, p.prodname, p.price as unit_price
      FROM supplierpurchasedetails spd
      JOIN products p ON spd.productid = p.productid
      WHERE spd.purchaseid = $1;
    `;
    const detailRes = await pool.query(detailQuery, [purchaseid]);

    return {
      ...orderRes.rows[0],
      items: detailRes.rows,
    };
  }

  async recordPayment(paymentData) {
    const query = `
      INSERT INTO supplierpayment (purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [
      paymentData.purchaseid,
      paymentData.amount, // maps to partialamountpaid
      paymentData.method,
      paymentData.paymongo_id,
      paymentData.checkout_url,
      paymentData.status || 'PENDING'
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async markPaymentPaidBySession(paymongo_id) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Update payment status
      const paymentRes = await client.query(
        "UPDATE supplierpayment SET status = 'PAID', updatedat = CURRENT_TIMESTAMP WHERE paymongo_id = $1 RETURNING *",
        [paymongo_id]
      );

      if (paymentRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const payment = paymentRes.rows[0];

      // 2. Update purchase order status (mark as ORDERED/CONFIRMED if payment success)
      await client.query(
        "UPDATE supplierpurchase SET status = 'COMPLETED', updatedat = CURRENT_TIMESTAMP WHERE purchaseid = $1",
        [payment.purchaseid]
      );

      await client.query("COMMIT");
      return payment;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updatePaymentStatus(paymongo_id, status) {
    const query = `
      UPDATE supplierpayment
      SET status = $1, updatedat = CURRENT_TIMESTAMP
      WHERE paymongo_id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [status, paymongo_id]);
    return rows[0];
  }

  async updateStatus(purchaseid, status) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Update Purchase Status
      const updatePoQuery = `
        UPDATE supplierpurchase
        SET status = $1, updatedat = CURRENT_TIMESTAMP
        WHERE purchaseid = $2
        RETURNING *;
      `;
      const poResult = await client.query(updatePoQuery, [status, purchaseid]);

      // 2. Automated Payment Settle for CASH upon Arrival
      if (status === 'ARRIVED') {
        const updatePayQuery = `
          UPDATE supplierpayment
          SET status = 'PAID'
          WHERE purchaseid = $1 AND method = 'CASH'
          RETURNING *;
        `;
        await client.query(updatePayQuery, [purchaseid]);
      }

      await client.query("COMMIT");
      return poResult.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async delete(purchaseid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM supplierpurchasedetails WHERE purchaseid = $1", [purchaseid]);
      await client.query("DELETE FROM supplierpurchase WHERE purchaseid = $1", [purchaseid]);
      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async fetchPaymentRecords() {
    const query = `
      SELECT 
        spay.supplierpaymentid,
        spay.purchaseid,
        spay.partialamountpaid,
        spay.method as payment_method,
        spay.status as payment_status,
        spay.createdat as payment_date,
        spay.checkout_url,
        spur.status as order_status,
        s.suppliername,
        b.branchname,
        (
          SELECT json_agg(json_build_object(
            'productid', pd.productid,
            'quantity', pd.quantity,
            'prodname', prod.prodname,
            'price', prod.price,
            'prodimage', prod.prodimage
          ))
          FROM supplierpurchasedetails pd
          JOIN products prod ON pd.productid = prod.productid
          WHERE pd.purchaseid = spur.purchaseid
        ) as items
      FROM supplierpayment spay
      JOIN supplierpurchase spur ON spay.purchaseid = spur.purchaseid
      JOIN supplier s ON spur.supplierid = s.supplierid
      LEFT JOIN branch b ON spur.branchid = b.branchid
      ORDER BY spay.createdat DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}
