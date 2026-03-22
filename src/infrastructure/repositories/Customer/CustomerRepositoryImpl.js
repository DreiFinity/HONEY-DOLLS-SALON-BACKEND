import CustomerAddressRepository from "../../../domain/repositories/Customer/CustomerAddressRepository.js";
import { pool } from "../../db/index.js";

export default class CustomerAddressRepositoryImpl extends CustomerAddressRepository {
  async findByUserId(userId) {
    const query = `
      SELECT c.firstname, c.lastname, c.contact, c.profileimage, u.email
      FROM customers c
      INNER JOIN users u ON c.userid = u.userid
      WHERE c.userid = $1
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) return null;

    return result.rows[0];
  }

  async updateProfile(userId, { firstname, lastname, contact }) {
    const result = await pool.query(
      `UPDATE customers
       SET firstname = $1, lastname = $2, contact = $3, updatedat = CURRENT_TIMESTAMP
       WHERE userid = $4
       RETURNING *`,
      [firstname, lastname, contact, userId]
    );
    return result.rows[0] || null;
  }

  async updateProfileImage(userId, filename) {
    const result = await pool.query(
      `UPDATE customers
       SET profileimage = $1, updatedat = CURRENT_TIMESTAMP
       WHERE userid = $2
       RETURNING *`,
      [filename, userId]
    );
    return result.rows[0] || null;
  }
  async create(data) {
    const result = await pool.query(
      `INSERT INTO customer_addresses
       (customerid, street, barangay, city, province, postal_code, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,false)
       RETURNING *`,
      [
        data.customerid,
        data.street,
        data.barangay,
        data.city,
        data.province,
        data.postal_code,
      ],
    );

    return result.rows[0];
  }

  async findByCustomer(customerid) {
    const result = await pool.query(
      `SELECT * FROM customer_addresses
       WHERE customerid = $1
       ORDER BY is_default DESC, created_at DESC`,
      [customerid],
    );

    return result.rows;
  }

  async update(addressid, customerid, data) {
    const result = await pool.query(
      `UPDATE customer_addresses
       SET street=$1,
           barangay=$2,
           city=$3,
           province=$4,
           postal_code=$5,
           is_default=$6
       WHERE addressid=$7
       AND customerid=$8
       RETURNING *`,
      [
        data.street,
        data.barangay,
        data.city,
        data.province,
        data.postal_code,
        data.is_default,
        addressid,
        customerid,
      ],
    );

    return result.rows[0] || null;
  }
  async findDefaultByCustomer(customerid) {
    const result = await pool.query(
      `SELECT * FROM customer_addresses 
     WHERE customerid = $1 AND is_default = true`,
      [customerid],
    );
    return result.rows;
  }
  async findById(addressid) {
    const result = await pool.query(
      `SELECT *
     FROM customer_addresses
     WHERE addressid = $1`,
      [addressid],
    );

    return result.rows[0] || null;
  }

  async delete(addressid, customerid) {
    const result = await pool.query(
      `DELETE FROM customer_addresses
       WHERE addressid=$1
       AND customerid=$2
       RETURNING *`,
      [addressid, customerid],
    );

    return result.rowCount > 0;
  }
}
