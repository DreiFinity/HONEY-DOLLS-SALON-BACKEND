import { pool } from "../../db/index.js";

export default class CustomerRepositoryImpl {
  async findByUserId(userId) {
    const query = `
      SELECT firstname, lastname
      FROM customers
      WHERE userid = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }
}
