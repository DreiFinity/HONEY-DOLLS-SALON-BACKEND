// src/infrastructure/repositories/Branch/ProductTransferRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ProductTransferRepositoryImpl {
  async createTransfer({ productid, from_branchid, to_branchid, quantity, adminid, remarks, reference_code }) {
    const query = `
      INSERT INTO product_transfers (productid, from_branchid, to_branchid, quantity, adminid, remarks, reference_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [productid, from_branchid, to_branchid, quantity, adminid, remarks, reference_code];
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
        (a.firstname || ' ' || a.lastname) as performed_by,
        pt.status
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

  async updateStatus(transferid, status) {
    const query = `
      UPDATE product_transfers 
      SET status = $1 
      WHERE transferid = $2 
      RETURNING *
    `;
    const { rows } = await pool.query(query, [status, transferid]);
    return rows[0];
  }

  async getTransfersByBranch(branchid) {
    const query = `
      SELECT 
        pt.*, 
        p.prodname, 
        b_from.branchname as from_branch_name, 
        b_to.branchname as to_branch_name,
        (a.firstname || ' ' || a.lastname) as performed_by,
        pt.status
      FROM product_transfers pt
      JOIN products p ON pt.productid = p.productid
      JOIN branch b_from ON pt.from_branchid = b_from.branchid
      JOIN branch b_to ON pt.to_branchid = b_to.branchid
      LEFT JOIN admin a ON pt.adminid = a.adminid
      WHERE pt.to_branchid = $1
      ORDER BY pt.transfer_date DESC
    `;
    const { rows } = await pool.query(query, [branchid]);
    return rows;
  }
}
