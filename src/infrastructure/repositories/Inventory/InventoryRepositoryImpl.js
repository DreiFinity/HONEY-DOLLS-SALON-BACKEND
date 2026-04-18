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
        WHERE cp.fulfillment_branchid = $1 AND o.status IN ('shipping', 'delivered')
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
      )
      SELECT 
        p.productid,
        p.prodname as name,
        p.price,
        p.prodcat as category,
        (COALESCE(a.total_in, 0) - COALESCE(f.total_out, 0) + COALESCE(r.total_returned, 0)) as stock,
        CURRENT_TIMESTAMP as updated
      FROM products p
      LEFT JOIN Arrivals a ON p.productid = a.productid
      LEFT JOIN Fulfillments f ON p.productid = f.productid
      LEFT JOIN Returns r ON p.productid = r.productid
      ORDER BY p.prodname ASC;
    `;
    const { rows } = await pool.query(query, [branchid]);
    return rows;
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
        FROM customerpayment_orders cpo
        JOIN orders o ON o.orderid = cpo.orderid
        JOIN orderdetails od ON od.orderid = o.orderid
        WHERE o.status IN ('shipping', 'delivered')
        GROUP BY od.productid
      ),
      Returns AS (
        SELECT 
          productid,
          SUM(quantity) as total_returned
        FROM product_returns
        WHERE status = 'completed'
        GROUP BY productid
      )
      SELECT 
        p.productid,
        p.prodname as name,
        p.price,
        p.prodcat as category,
        (COALESCE(a.total_in, 0) - COALESCE(f.total_out, 0) + COALESCE(r.total_returned, 0)) as stock,
        CURRENT_TIMESTAMP as updated,
        'All Branches' as branchname
      FROM products p
      LEFT JOIN Arrivals a ON p.productid = a.productid
      LEFT JOIN Fulfillments f ON p.productid = f.productid
      LEFT JOIN Returns r ON p.productid = r.productid
      ORDER BY p.prodname ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}
