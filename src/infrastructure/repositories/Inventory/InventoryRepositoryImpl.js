import { pool } from "../../db/index.js";

export default class InventoryRepositoryImpl {
  async getBranchInventory(branchid) {
    const query = `
      WITH Arrivals AS (
        SELECT 
          spd.productid,
          SUM(spd.quantity) as total_in
        FROM supplierpurchase sp
        JOIN supplierpurchasedetails spd ON sp.purchaseid = spd.purchaseid
        WHERE sp.branchid = $1 AND sp.status = 'ARRIVED'
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
        WHERE cp.fulfillment_branchid = $1 AND o.status IN ('pending', 'processing', 'shipping', 'delivered', 'completed')
        GROUP BY od.productid
      ),
      Returns AS (
        SELECT 
          r.productid,
          SUM(r.quantity) as total_returned
        FROM product_returns r
        JOIN customerpayment_orders cpo ON r.orderid = cpo.orderid
        JOIN customerpayment cp ON cp.customerpaymentid = cpo.customerpaymentid
        WHERE cp.fulfillment_branchid = $1 AND r.status = 'completed'
        GROUP BY r.productid
      ),
      TransfersIn AS (
        SELECT 
          productid,
          SUM(quantity) as total_transfer_in
        FROM product_transfers
        WHERE to_branchid = $1::INTEGER AND status = 'ARRIVED'
        GROUP BY productid
      ),
      TransfersOut AS (
        SELECT 
          productid,
          SUM(quantity) as total_transfer_out
        FROM product_transfers
        WHERE from_branchid = $1::INTEGER
        GROUP BY productid
      ),
      Adjustments AS (
        SELECT 
          productid,
          SUM(COALESCE(quantity, 1)) as total_adjustment
        FROM product_adjustments
        WHERE branchid = $1::INTEGER
        GROUP BY productid
      )
      SELECT 
        p.productid,
        p.prodname as name,
        p.price,
        p.prodcat as category,
        (COALESCE(a.total_in, 0) - COALESCE(f.total_out, 0) + COALESCE(r.total_returned, 0) + COALESCE(ti.total_transfer_in, 0) - COALESCE(tout.total_transfer_out, 0) - COALESCE(adj.total_adjustment, 0)) as stock,
        CURRENT_TIMESTAMP as updated
      FROM products p
      LEFT JOIN Arrivals a ON p.productid = a.productid
      LEFT JOIN Fulfillments f ON p.productid = f.productid
      LEFT JOIN Returns r ON p.productid = r.productid
      LEFT JOIN TransfersIn ti ON p.productid = ti.productid
      LEFT JOIN TransfersOut tout ON p.productid = tout.productid
      LEFT JOIN Adjustments adj ON p.productid = adj.productid
      ORDER BY p.prodname ASC;
    `;
    try {
      const { rows } = await pool.query(query, [parseInt(branchid)]);
      return rows;
    } catch (err) {
      console.error("Inventory Query Error for branch:", branchid, err.message);
      throw err;
    }
  }

  async getTotalInventory() {
    const query = `
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
        p.productid,
        p.prodname as name,
        p.price,
        p.prodcat as category,
        (COALESCE(a.total_in, 0) - COALESCE(f.total_out, 0) + COALESCE(r.total_returned, 0) - COALESCE(adj.total_adjustment, 0)) as stock,
        CURRENT_TIMESTAMP as updated
      FROM products p
      LEFT JOIN Arrivals a ON p.productid = a.productid
      LEFT JOIN Fulfillments f ON p.productid = f.productid
      LEFT JOIN Returns r ON p.productid = r.productid
      LEFT JOIN Adjustments adj ON p.productid = adj.productid
      ORDER BY p.prodname ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}
