import { UserRepository } from "../../../domain/repositories/Login/UserRepository.js";
import { pool } from "../../db/index.js";

export class UserRepositoryImpl extends UserRepository {
  // Inserts into users AND customers in a transaction
  async createWithCustomer({
    username,
    email,
    password,
    role,
    firstname,
    lastname,
    contact,
  }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (username, email, password, role)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [username, email, password, role]
      );
      const user = userResult.rows[0];

      // Insert customer linked to user
      await client.query(
        `INSERT INTO customers (firstname, lastname, contact, userid)
         VALUES ($1, $2, $3, $4)`,
        [firstname, lastname, contact, user.userid]
      );

      await client.query("COMMIT");
      return user; // return user info
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0];
  }
}
