import { pool } from "../../db/index.js";

export default class AdminRepositoryImpl {
  async findByUserId(userId) {
    const query = `
      SELECT a.adminid, a.firstname, a.lastname, a.contact, a.image, u.email
      FROM admin a
      JOIN users u ON a.userid = u.userid
      WHERE a.userid = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  async updateProfile(userId, { firstname, lastname, contact, email }) {
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update admin table
      await client.query(
        `UPDATE admin
         SET firstname = $1, lastname = $2, contact = $3, updatedat = CURRENT_TIMESTAMP
         WHERE userid = $4`,
        [firstname, lastname, contact, userId]
      );

      // Update users table for email
      if (email) {
        await client.query(
          `UPDATE users SET email = $1 WHERE userid = $2`,
          [email, userId]
        );
      }

      await client.query("COMMIT");

      // Fetch and return the updated profile
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
      `UPDATE admin
       SET image = $1, updatedat = CURRENT_TIMESTAMP
       WHERE userid = $2
       RETURNING *`,
      [filename, userId]
    );
    return result.rows[0] || null;
  }
}
