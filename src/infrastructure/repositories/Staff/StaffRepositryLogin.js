import { pool } from "../../db/index.js";

export class StaffRepository {
  // Inserts into users AND customers in a transaction
  async createUser({ username, email, password, role }) {
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [username, email, password, role]
    );
    return result.rows[0];
  }

  async createStaff({ firstname, lastname, contact, userid }) {
    const result = await pool.query(
      `INSERT INTO staff (firstname, lastname, contact, userid)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [firstname, lastname, contact, userid]
    );
    return result.rows[0];
  }

  async findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }
}
