// src/infrastructure/repositories/Product/ProductRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ProductRepositoryImpl {
  async getAll() {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY productid ASC"
    );
    return result.rows;
  }

  async create(productData) {
    const { prodname, prodcat, price, supplier_price, prodimage } = productData;

    const query = `
      INSERT INTO products (prodname, prodcat, price, supplier_price, prodimage)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [prodname, prodcat, price, supplier_price || 0, prodimage];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  async update(productid, productData) {
    const { prodname, prodcat, price, supplier_price, prodimage } = productData;

    const query = `
      UPDATE products
      SET prodname = $1,
          prodcat = $2,
          price = $3,
          supplier_price = $4,
          prodimage = COALESCE($5, prodimage)
      WHERE productid = $6
      RETURNING *
    `;

    const values = [prodname, prodcat, price, supplier_price || 0, prodimage, productid];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(productid) {
    const query = "DELETE FROM products WHERE productid = $1";
    await pool.query(query, [productid]);
    return true;
  }

  async getLedger(productid) {
    const query = `
      (
        -- Arrivals (Purchases)
        SELECT 
          sp.createdat as date,
          pay.reference_code,
          'PURCHASE' as type,
          spd.quantity as quantity,
          'Supplier Restock' as remarks,
          b.branchname as branch
        FROM supplierpurchase sp
        JOIN supplierpurchasedetails spd ON sp.purchaseid = spd.purchaseid
        LEFT JOIN branch b ON sp.branchid = b.branchid
        LEFT JOIN LATERAL (
          SELECT reference_code 
          FROM supplierpayment 
          WHERE purchaseid = sp.purchaseid 
          ORDER BY createdat ASC 
          LIMIT 1
        ) pay ON true
        WHERE spd.productid = $1 AND sp.status = 'ARRIVED'
      )
      UNION ALL
      (
        -- Fulfillments (Sales via Customer Payment)
        SELECT 
          o.createdat as date,
          cp.reference_code,
          'SALE' as type,
          -od.quantity as quantity,
          'Sold to Customer' as remarks,
          b.branchname as branch
        FROM customerpayment cp
        JOIN customerpayment_orders cpo ON cp.customerpaymentid = cpo.customerpaymentid
        JOIN orders o ON cpo.orderid = o.orderid
        JOIN orderdetails od ON o.orderid = od.orderid
        LEFT JOIN branch b ON cp.fulfillment_branchid = b.branchid
        WHERE od.productid = $1 AND o.status IN ('shipping', 'delivered', 'completed')
      )
      UNION ALL
      (
        -- Adjustments
        SELECT 
          pa.datetime as date,
          pa.reference_code,
          UPPER(pa.type) as type,
          -COALESCE(pa.quantity, 1) as quantity,
          pa.reason || ' ' || COALESCE(pa.remarks, '') as remarks,
          b.branchname as branch
        FROM product_adjustments pa
        LEFT JOIN branch b ON pa.branchid = b.branchid
        WHERE pa.productid = $1
      )
      UNION ALL
      (
        -- Returns
        SELECT 
          r.createdat as date,
          COALESCE(r.reference_code, cp.reference_code) as reference_code,
          'RETURN' as type,
          r.quantity as quantity,
          r.reason as remarks,
          b.branchname as branch
        FROM product_returns r
        JOIN customerpayment_orders cpo ON r.orderid = cpo.orderid
        JOIN customerpayment cp ON cp.customerpaymentid = cpo.customerpaymentid
        LEFT JOIN branch b ON cp.fulfillment_branchid = b.branchid
        WHERE r.productid = $1 AND r.status = 'completed'
      )
      UNION ALL
      (
        -- Transfers In
        SELECT 
          pt.transfer_date as date,
          pt.reference_code,
          'TRANSFER_IN' as type,
          pt.quantity as quantity,
          'From ' || fb.branchname as remarks,
          tb.branchname as branch
        FROM product_transfers pt
        LEFT JOIN branch fb ON pt.from_branchid = fb.branchid
        LEFT JOIN branch tb ON pt.to_branchid = tb.branchid
        WHERE pt.productid = $1 AND pt.status = 'ARRIVED'
      )
      UNION ALL
      (
        -- Transfers Out
        SELECT 
          pt.transfer_date as date,
          pt.reference_code,
          'TRANSFER_OUT' as type,
          -pt.quantity as quantity,
          'To ' || tb.branchname as remarks,
          fb.branchname as branch
        FROM product_transfers pt
        LEFT JOIN branch fb ON pt.from_branchid = fb.branchid
        LEFT JOIN branch tb ON pt.to_branchid = tb.branchid
        WHERE pt.productid = $1
      )
      ORDER BY date DESC;
    `;
    const result = await pool.query(query, [productid]);
    return result.rows;
  }
}
