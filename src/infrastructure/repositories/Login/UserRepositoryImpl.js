// src/infrastructure/repositories/Login/UserRepositoryImpl.js
import { UserRepository } from "../../../domain/repositories/Login/UserRepository.js";
import { pool } from "../../db/index.js";
import bcrypt from "bcryptjs";

export class UserRepositoryImpl extends UserRepository {
  async createUser({ username, email, password, role }) {
    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [username, email, password, role]);
    return rows[0];
  }

  async createCustomer({
    firstname,
    lastname,
    contact,
    userid,
    street,
    barangay,
    city,
    province,
    postal_code,
  }) {
    // 1️⃣ Create customer
    const customerResult = await pool.query(
      `INSERT INTO customers (firstname, lastname, contact, userid)
     VALUES ($1, $2, $3, $4)
     RETURNING *;`,
      [firstname, lastname, contact, userid],
    );

    const customer = customerResult.rows[0];

    // 2️⃣ Insert first address (default = true)
    await pool.query(
      `INSERT INTO customer_addresses
     (customerid, street, barangay, city, province, postal_code, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,true)`,
      [customer.customerid, street, barangay, city, province, postal_code],
    );

    return {
      ...customer,
      street,
      barangay,
      city,
      province,
      postal_code,
    };
  }

  async createStaff({ firstname, lastname, contact, branchid, userid, image, role }) {
    const { rows } = await pool.query(
      `INSERT INTO staff (firstname, lastname, contact, branchid, userid, image, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *;`,
      [firstname, lastname, contact, branchid, userid, image, role],
    );
    return rows[0];
  }

  async createAdmin({ firstname, lastname, contact, userid, image }) {
    const { rows } = await pool.query(
      `INSERT INTO admin (firstname, lastname, contact, userid, image)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *;`,
      [firstname, lastname, contact, userid, image],
    );
    return rows[0];
  }

  async findByEmail(email) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    return rows[0];
  }

  async findByUsername(username) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE username = $1`, [
      username,
    ]);
    return rows[0];
  }

  async getUserIdByStaffId(staffid) {
    const { rows } = await pool.query(`SELECT userid FROM staff WHERE staffid = $1`, [
      staffid,
    ]);
    return rows[0]?.userid || null;
  }
  async findByRole(role) {
    const { rows } = await pool.query(`SELECT * FROM users WHERE role = $1`, [
      role,
    ]);
    return rows;
  }
  async getAllStaff() {
    const { rows } = await pool.query(
      `SELECT s.*, u.username, u.email, b.branchname
       FROM staff s
       JOIN users u ON s.userid = u.userid
       LEFT JOIN branch b ON s.branchid = b.branchid
       ORDER BY s.staffid DESC`,
    );
    return rows;
  }

  async updateStaff(
    id,
    {
      firstname,
      lastname,
      contact,
      branchid,
      email,
      username,
      password,
      image,
      role,
    },
  ) {
    // Update user table first if username/email/password is provided
    const userFields = [];
    const userValues = [];
    let idx = 1;

    if (username) {
      userFields.push(`username=$${idx++}`);
      userValues.push(username);
    }
    if (email) {
      userFields.push(`email=$${idx++}`);
      userValues.push(email);
    }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      userFields.push(`password=$${idx++}`);
      userValues.push(hashed);
    }

    if (userFields.length) {
      const userQuery = `UPDATE users SET ${userFields.join(", ")} 
                         WHERE userid = (SELECT userid FROM staff WHERE staffid=$${idx})`;
      userValues.push(id);
      await pool.query(userQuery, userValues);
    }

    // Update staff table
    const staffFields = [];
    const staffValues = [];
    idx = 1;

    if (firstname) {
      staffFields.push(`firstname=$${idx++}`);
      staffValues.push(firstname);
    }
    if (lastname) {
      staffFields.push(`lastname=$${idx++}`);
      staffValues.push(lastname);
    }
    if (contact) {
      staffFields.push(`contact=$${idx++}`);
      staffValues.push(contact);
    }
    if (branchid) {
      staffFields.push(`branchid=$${idx++}`);
      staffValues.push(branchid);
    }
    if (image) {
      staffFields.push(`image=$${idx++}`);
      staffValues.push(image);
    }
    if (role) {
      staffFields.push(`role=$${idx++}`);
      staffValues.push(role);
    }

    if (staffFields.length) {
      const staffQuery = `UPDATE staff SET ${staffFields.join(
        ", ",
      )} WHERE staffid=$${idx} RETURNING *`;
      staffValues.push(id);
      const { rows } = await pool.query(staffQuery, staffValues);
      return rows[0];
    }

    return null;
  }

  async deleteStaff(staffid) {
    // Delete user first
    const { rows } = await pool.query(`SELECT userid FROM staff WHERE staffid=$1`, [
      staffid,
    ]);
    if (rows.length === 0) throw new Error("Staff not found");

    const userid = rows[0].userid;
    await pool.query(`DELETE FROM staff WHERE staffid=$1`, [staffid]);
    await pool.query(`DELETE FROM users WHERE userid=$1`, [userid]);

    return { message: "Staff deleted successfully" };
  }
}
