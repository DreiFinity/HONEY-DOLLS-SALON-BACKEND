// src/infrastructure/repositories/Service/ServiceRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ProductRepositoryImpl {
  async getAll() {
    const result = await pool.query(
      "SELECT * FROM public.products ORDER BY productid ASC "
    );
    return result.rows;
  }

  async create(productData) {
    const { prodname, prodcat, price, prodimage } = productData;

    const query = `
      INSERT INTO products (prodname, prodcat, price, prodimage) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [prodname, prodcat, price, prodimage];

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
