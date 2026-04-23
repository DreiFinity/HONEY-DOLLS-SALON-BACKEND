// src/infrastructure/repositories/Branch/BranchRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class BranchRepositoryImpl {
  async getAllBranches() {
    const { rows } = await pool.query(
      "SELECT branchid, branchname, location FROM branch ORDER BY branchname ASC"
    );
    return rows;
  }

  async create(data) {
    const { branchname, location } = data;
    
    // Manual ID fallback: Get current max ID and increment it
    // This fixes the 'null value in column branchid violates not-null constraint' error
    const maxIdRes = await pool.query("SELECT COALESCE(MAX(branchid), 0) + 1 as nextid FROM branch");
    const nextId = maxIdRes.rows[0].nextid;

    const { rows } = await pool.query(
      "INSERT INTO branch (branchid, branchname, location) VALUES ($1, $2, $3) RETURNING *",
      [nextId, branchname, location]
    );
    return rows[0];
  }

  async update(id, data) {
    const { branchname, location } = data;
    const { rows } = await pool.query(
      "UPDATE branch SET branchname = $1, location = $2 WHERE branchid = $3 RETURNING *",
      [branchname, location, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    const result = await pool.query("DELETE FROM branch WHERE branchid = $1 RETURNING *", [id]);
    return result.rowCount > 0;
  }
}
