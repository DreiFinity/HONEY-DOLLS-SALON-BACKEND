// src/infrastructure/repositories/Staff/StaffRepositoryImpl.js
import { pool } from "../../db/index.js";

export default class StaffRepositoryImpl {
  async getAllStaff() {
    const result = await pool.query(`
      SELECT staffid, userid, firstname, lastname, contact, branchid 
      FROM staff ORDER BY staffid ASC
    `);
    return result.rows;
  }
  async findByUserId(userId) {
    const query = `
      SELECT s.firstname, s.lastname, s.contact, s.branchid, s.image, s.role, b.branchname, b.location as branch_location, u.email
      FROM staff s
      LEFT JOIN branch b ON s.branchid = b.branchid
      JOIN users u ON s.userid = u.userid
      WHERE s.userid = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  async updateProfile(userId, { firstname, lastname, contact, email }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `UPDATE staff
         SET firstname = $1, lastname = $2, contact = $3, updatedat = CURRENT_TIMESTAMP
         WHERE userid = $4`,
        [firstname, lastname, contact, userId]
      );
      if (email) {
        await client.query(
          `UPDATE users SET email = $1 WHERE userid = $2`,
          [email, userId]
        );
      }
      await client.query("COMMIT");
      return await this.findByUserId(userId);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateProfileImage(userId, filename) {
    const result = await pool.query(
      `UPDATE staff
       SET image = $1, updatedat = CURRENT_TIMESTAMP
       WHERE userid = $2
       RETURNING *`,
      [filename, userId]
    );
    return result.rows[0] || null;
  }
}
