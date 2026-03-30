// src/infrastructure/repositories/Branch/BranchRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class BranchRepositoryImpl {
  async getAllBranches() {
    const { rows } = await pool.query(
      "SELECT branchid, branchname, location FROM branch ORDER BY branchname ASC"
    );
    return rows;
  }
}
