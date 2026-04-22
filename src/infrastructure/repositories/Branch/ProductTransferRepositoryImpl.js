// src/infrastructure/repositories/Branch/ProductTransferRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ProductTransferRepositoryImpl {
  async createTransfer({ productid, from_branchid, to_branchid, quantity, adminid, remarks }) {
    const query = `
      INSERT INTO product_transfers (productid, from_branchid, to_branchid, quantity, adminid, remarks)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [productid, from_branchid, to_branchid, quantity, adminid, remarks];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async getAllTransfers() {
    const query = `
      SELECT 
        pt.*, 
        p.prodname, 
        b_from.branchname as from_branch_name, 
        b_to.branchname as to_branch_name,
        (a.firstname || ' ' || a.lastname) as performed_by
      FROM product_transfers pt
      JOIN products p ON pt.productid = p.productid
      JOIN branch b_from ON pt.from_branchid = b_from.branchid
      JOIN branch b_to ON pt.to_branchid = b_to.branchid
      JOIN admin a ON pt.adminid = a.adminid
      ORDER BY pt.transfer_date DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}
