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
        JOIN orderdetails od ON cpo.orderid = od.orderid
        WHERE cp.fulfillment_branchid = $1 AND cp.status IN ('shipping', 'delivered')
        GROUP BY od.productid
      )
      SELECT 
        p.productid,
        p.prodname as name,
        p.price,
        p.prodcat as category,
        (COALESCE(a.total_in, 0) - COALESCE(f.total_out, 0)) as stock,
        CURRENT_TIMESTAMP as updated
      FROM products p
      LEFT JOIN Arrivals a ON p.productid = a.productid
      LEFT JOIN Fulfillments f ON p.productid = f.productid
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
        FROM customerpayment cp
        JOIN customerpayment_orders cpo ON cp.customerpaymentid = cpo.customerpaymentid
        JOIN orderdetails od ON cpo.orderid = od.orderid
        WHERE cp.status IN ('shipping', 'delivered')
        GROUP BY od.productid
      )
      SELECT 
        p.productid,
        p.prodname as name,
        p.price,
        p.prodcat as category,
        (COALESCE(a.total_in, 0) - COALESCE(f.total_out, 0)) as stock,
        CURRENT_TIMESTAMP as updated,
        'All Branches' as branchname
      FROM products p
      LEFT JOIN Arrivals a ON p.productid = a.productid
      LEFT JOIN Fulfillments f ON p.productid = f.productid
      ORDER BY p.prodname ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}
