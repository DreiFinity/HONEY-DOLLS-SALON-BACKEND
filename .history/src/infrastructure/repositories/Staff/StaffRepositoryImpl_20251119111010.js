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
}
