// src/infrastructure/repositories/Service/ServiceRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ProductRepositoryImpl {
  async getAllProducts() {
    const result = await pool.query(
      "SELECT * FROM public.products ORDER BY productid ASC "
    );
    return result.rows;
  }
}
