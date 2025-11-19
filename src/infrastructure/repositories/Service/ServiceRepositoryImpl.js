// src/infrastructure/repositories/Service/ServiceRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ServiceRepositoryImpl {
  async getAllServices() {
    const result = await pool.query(
      "SELECT * FROM service ORDER BY serviceid ASC"
    );
    return result.rows;
  }
}
