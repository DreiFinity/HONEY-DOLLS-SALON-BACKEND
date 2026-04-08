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
    const { prodname, prodcat, price, supplier_price, prodimage } = productData;

    const query = `
      INSERT INTO products (prodname, prodcat, price, supplier_price, prodimage)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [prodname, prodcat, price, supplier_price || 0, prodimage];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  async update(productid, productData) {
    const { prodname, prodcat, price, supplier_price, prodimage } = productData;

    const query = `
      UPDATE products
      SET prodname = $1,
          prodcat = $2,
          price = $3,
          supplier_price = $4,
          prodimage = COALESCE($5, prodimage)
      WHERE productid = $6
      RETURNING *
    `;

    const values = [prodname, prodcat, price, supplier_price || 0, prodimage, productid];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(productid) {
    const query = "DELETE FROM products WHERE productid = $1";
    await pool.query(query, [productid]);
    return true;
  }
}
