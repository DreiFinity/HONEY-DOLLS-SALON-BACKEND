import { pool } from "../../db/index.js";

export default class SupplierRepositoryImpl {
  async getAll() {
    const result = await pool.query("SELECT * FROM supplier ORDER BY supplierid DESC");
    return result.rows;
  }

  async getById(id) {
    const result = await pool.query("SELECT * FROM supplier WHERE supplierid = $1", [id]);
    return result.rows[0] || null;
  }

  async create(data) {
    const { suppliername, contactperson, contacts, address, remarks } = data;
    const result = await pool.query(
      `INSERT INTO supplier (suppliername, contactperson, contacts, address, remarks)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [suppliername, contactperson, contacts, address, remarks]
    );
    return result.rows[0];
  }

  async update(id, data) {
    const { suppliername, contactperson, contacts, address, remarks } = data;
    const result = await pool.query(
      `UPDATE supplier 
       SET suppliername = $1, contactperson = $2, contacts = $3, address = $4, remarks = $5
       WHERE supplierid = $6
       RETURNING *`,
      [suppliername, contactperson, contacts, address, remarks, id]
    );
    return result.rows[0] || null;
  }

  async delete(id) {
    const result = await pool.query("DELETE FROM supplier WHERE supplierid = $1 RETURNING *", [id]);
    return result.rowCount > 0;
  }
}
