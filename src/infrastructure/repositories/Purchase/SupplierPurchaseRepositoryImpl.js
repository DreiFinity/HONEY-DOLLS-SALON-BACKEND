const generateReferenceCode = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PO-${timestamp}-${random}`;
};


import SupplierPurchaseRepository from "../../../domain/repositories/Purchase/SupplierPurchaseRepository.js";
import { pool } from "../../db/index.js";

export default class SupplierPurchaseRepositoryImpl extends SupplierPurchaseRepository {
  async create(purchaseData, items, paymentTerms = { type: 'IMMEDIATE', days: 0 }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Insert Master: supplierpurchase
      const orderQuery = `
        INSERT INTO supplierpurchase (supplierid, status, branchid)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const orderValues = [
        purchaseData.supplierid,
        purchaseData.status || "PENDING",
        purchaseData.branchid
      ];
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
      SELECT DISTINCT ON (sp.purchaseid) 
        sp.*, s.suppliername, b.branchname, pay.payment_type, pay.payment_term_days
      FROM supplierpurchase sp
      JOIN supplier s ON sp.supplierid = s.supplierid
      LEFT JOIN branch b ON sp.branchid = b.branchid
      LEFT JOIN supplierpayment pay ON sp.purchaseid = pay.purchaseid
      ORDER BY sp.purchaseid, pay.createdat ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async findById(purchaseid) {
    // Get master
    const orderQuery = `
      SELECT sp.*, s.suppliername, b.branchname, pay.payment_type, pay.payment_term_days
      FROM supplierpurchase sp
      JOIN supplier s ON sp.supplierid = s.supplierid
      LEFT JOIN branch b ON sp.branchid = b.branchid
      LEFT JOIN supplierpayment pay ON sp.purchaseid = pay.purchaseid
      WHERE sp.purchaseid = $1
      ORDER BY pay.createdat ASC
      LIMIT 1;
    `;
    const orderRes = await pool.query(orderQuery, [purchaseid]);
    if (orderRes.rows.length === 0) return null;

    // Get details
    const detailQuery = `
      SELECT spd.*, p.prodname, p.supplier_price as unit_price
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
      INSERT INTO supplierpayment (purchaseid, partialamountpaid, method, paymongo_id, checkout_url, status, reference_code, payment_type, payment_term_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (paymongo_id) DO NOTHING
      RETURNING *;
    `;
    const values = [
      paymentData.purchaseid,
      paymentData.amount,
      paymentData.method,
      paymentData.paymongo_id,
      paymentData.checkout_url,
      paymentData.status || 'PENDING',
      paymentData.reference_code || generateReferenceCode(),
      paymentData.payment_type || 'IMMEDIATE',
      paymentData.payment_term_days || 0
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

      // 2. Automated Payment Settle for CASH upon Arrival + Increment Stock
      if (status === 'ARRIVED') {
        // Mark cash payments as paid
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
        sp.purchaseid, 
        sp.status as order_status, 
        sp.createdat as order_date,
        pay.payment_type,
        pay.payment_term_days,
        s.suppliername, 
        b.branchname,
        b.branchid,
        pay.supplierpaymentid,
        pay.partialamountpaid,
        pay.method as payment_method,
        pay.status as payment_status,
        pay.paymongo_id,
        pay.reference_code,
        pay.createdat as payment_date,
        (
          SELECT json_agg(json_build_object(
            'productid', pd.productid,
            'quantity', pd.quantity,
            'prodname', prod.prodname,
            'supplier_price', prod.supplier_price,
            'prodimage', prod.prodimage
          ))
          FROM supplierpurchasedetails pd
          JOIN products prod ON pd.productid = prod.productid
          WHERE pd.purchaseid = sp.purchaseid
        ) as items
      FROM supplierpurchase sp
      JOIN supplier s ON sp.supplierid = s.supplierid
      LEFT JOIN branch b ON sp.branchid = b.branchid
      LEFT JOIN supplierpayment pay ON sp.purchaseid = pay.purchaseid
      GROUP BY sp.purchaseid, s.suppliername, b.branchname, b.branchid, pay.supplierpaymentid
      ORDER BY sp.createdat DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}
