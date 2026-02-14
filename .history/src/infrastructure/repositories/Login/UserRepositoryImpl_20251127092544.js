// src/infrastructure/repositories/Login/UserRepositoryImpl.js
import { UserRepository } from "../../../domain/repositories/Login/UserRepository.js";
import { pool } from "../../db/index.js";
import bcrypt from "bcryptjs";

export default class UserRepositoryImpl extends UserRepository {
  async createUser({ username, email, password, role }) {
    const hashed = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [username, email, hashed, role]);
    return rows[0];
  }

  async createCustomer({ firstname, lastname, contact, userid }) {
    const { rows } = await pool.query(
      `INSERT INTO customers (firstname, lastname, contact, userid)
       VALUES ($1, $2, $3, $4)
       RETURNING *;`,
      [firstname, lastname, contact, userid]
    );
    return rows[0];
  }

  async createStaff({ firstname, lastname, contact, branchid, userid }) {
    const { rows } = await pool.query(
      `INSERT INTO staff (firstname, lastname, contact, branchid, userid)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [firstname, lastname, contact, branchid, userid]
    );
    return rows[0];
  }

  async createAdmin({ firstname, lastname, contact, branchid, userid }) {
    const { rows } = await pool.query(
      `INSERT INTO admin (firstname, lastname, contact, branchid, userid)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [firstname, lastname, contact, branchid, userid]
    );
    return rows[0];
  }

  async findByEmail(email) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    return rows[0];
  }
}
