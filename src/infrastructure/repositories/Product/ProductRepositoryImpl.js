// src/infrastructure/repositories/Product/ProductRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class ProductRepositoryImpl {
  async getAll() {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY productid ASC"
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
  async update(productid, productData) {
    const { prodname, prodcat, price, prodimage } = productData;

    const query = `
      UPDATE products
      SET prodname = $1,
          prodcat = $2,
          price = $3,
          prodimage = COALESCE($4, prodimage)
      WHERE productid = $5
      RETURNING *
    `;

    const values = [prodname, prodcat, price, prodimage, productid];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(productid) {
    const query = "DELETE FROM products WHERE productid = $1";
    await pool.query(query, [productid]);
    return true;
  }
}
