// src/infrastructure/repositories/Product/ProductRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ProductRepositoryImpl {
  async getAll() {
    const result = await pool.query(`
      WITH Arrivals AS (
        SELECT 
          spd.productid,
          SUM(spd.quantity) as total_in
        FROM supplierpurchase sp
        JOIN supplierpurchasedetails spd ON sp.purchaseid = spd.purchaseid
        WHERE sp.status = 'ARRIVED'
        GROUP BY spd.productid
      ),
      Fulfillments AS (
        SELECT 
          od.productid,
          SUM(od.quantity) as total_out
        FROM customerpayment cp
        JOIN customerpayment_orders cpo ON cp.customerpaymentid = cpo.customerpaymentid
        JOIN orders o ON o.orderid = cpo.orderid
        JOIN orderdetails od ON od.orderid = o.orderid
        WHERE o.status IN ('pending', 'processing', 'shipping', 'delivered', 'completed')
        GROUP BY od.productid
      ),
      Returns AS (
        SELECT 
          r.productid,
          SUM(r.quantity) as total_returned
        FROM product_returns r
        WHERE r.status = 'completed'
        GROUP BY r.productid
      ),
      Adjustments AS (
        SELECT 
          productid,
          SUM(COALESCE(quantity, 1)) as total_adjustment
        FROM product_adjustments
        GROUP BY productid
      )
      SELECT 
        p.*,
        (COALESCE(a.total_in, 0) - COALESCE(f.total_out, 0) + COALESCE(r.total_returned, 0) - COALESCE(adj.total_adjustment, 0))::INTEGER as stock
      FROM products p
      LEFT JOIN Arrivals a ON p.productid = a.productid
      LEFT JOIN Fulfillments f ON p.productid = f.productid
      LEFT JOIN Returns r ON p.productid = r.productid
      LEFT JOIN Adjustments adj ON p.productid = adj.productid
      ORDER BY p.productid ASC
    `);
    return result.rows;
  }

  async create(productData) {
    const { prodname, prodcat, price, supplier_price, prodimage, weight_kg } = productData;

    const query = `
      INSERT INTO products (prodname, prodcat, price, supplier_price, prodimage, weight_kg)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [prodname, prodcat, price, supplier_price || 0, prodimage, weight_kg || 1.0];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  async update(productid, productData) {
    const { prodname, prodcat, price, supplier_price, prodimage, weight_kg } = productData;

    const query = `
      UPDATE products
      SET prodname = $1,
          prodcat = $2,
          price = $3,
          supplier_price = $4,
          prodimage = COALESCE($5, prodimage),
          weight_kg = $6
      WHERE productid = $7
      RETURNING *
    `;

    const values = [prodname, prodcat, price, supplier_price || 0, prodimage, weight_kg || 1.0, productid];
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
          p.supplier_price AS purchase_cost,
          'Supplier Restock' as remarks,
          b.branchname as branch
        FROM supplierpurchase sp
        JOIN supplierpurchasedetails spd ON sp.purchaseid = spd.purchaseid
        JOIN products p ON spd.productid = p.productid
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
          p.supplier_price AS purchase_cost,
          'Sold to Customer' as remarks,
          b.branchname as branch
        FROM customerpayment cp
        JOIN customerpayment_orders cpo ON cp.customerpaymentid = cpo.customerpaymentid
        JOIN orders o ON cpo.orderid = o.orderid
        JOIN orderdetails od ON o.orderid = od.orderid
        JOIN products p ON od.productid = p.productid
        LEFT JOIN branch b ON cp.fulfillment_branchid = b.branchid
        WHERE od.productid = $1 AND o.status IN ('pending', 'processing', 'shipping', 'delivered', 'completed')
      )
      UNION ALL
      (
        -- Adjustments
        SELECT 
          pa.datetime as date,
          pa.reference_code,
          UPPER(pa.type) as type,
          -COALESCE(pa.quantity, 1) as quantity,
          p.supplier_price AS purchase_cost,
          pa.reason || ' ' || COALESCE(pa.remarks, '') as remarks,
          b.branchname as branch
        FROM product_adjustments pa
        JOIN products p ON pa.productid = p.productid
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
          p.supplier_price AS purchase_cost,
          r.reason as remarks,
          b.branchname as branch
        FROM product_returns r
        JOIN customerpayment_orders cpo ON r.orderid = cpo.orderid
        JOIN customerpayment cp ON cp.customerpaymentid = cpo.customerpaymentid
        JOIN products p ON r.productid = p.productid
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
          p.supplier_price AS purchase_cost,
          'From ' || fb.branchname as remarks,
          tb.branchname as branch
        FROM product_transfers pt
        JOIN products p ON pt.productid = p.productid
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
          p.supplier_price AS purchase_cost,
          'To ' || tb.branchname as remarks,
          fb.branchname as branch
        FROM product_transfers pt
        JOIN products p ON pt.productid = p.productid
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
