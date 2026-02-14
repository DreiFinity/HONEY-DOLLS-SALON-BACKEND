// src/infrastructure/repositories/Staff/StaffRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class StaffRepositoryImpl {
  async getAllStaff() {
    const result = await pool.query(`
      SELECT staffid, firstname, lastname, contact, branchid 
      FROM staff ORDER BY staffid ASC
    `);
    return result.rows;
  }
  async findByUserId(userId) {
    const query = `
      SELECT firstname, lastname, branchid, image
      FROM staff
      WHERE userid = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }
}
