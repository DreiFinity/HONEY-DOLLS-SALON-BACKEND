// src/infrastructure/repositories/Appointment/AppointmentRepositoryImpl.js
import { pool } from "../../db/index.js";

export class AppointmentRepositoryImpl {
  async findCustomerIdByUserId(userId) {
    const result = await pool.query(
      `SELECT customerid FROM customers WHERE userid = $1`,
      [userId]
    );
    return result.rows[0] ? result.rows[0].customerid : null;
  }

  async createAppointment({
    serviceid,
    customerid,
    starttime,
    endtime,
    staffid,
    notes,
    priority,
    status,
    recurring,
    recurrencerule,
  }) {
    const result = await pool.query(
      `INSERT INTO appointment (
        serviceid, customerid, starttime, endtime,
        staffid, notes, priority, status,
        recurring, recurrencerule
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        serviceid,
        customerid,
        starttime,
        endtime,
        staffid,
        notes,
        priority,
        status,
        recurring,
        recurrencerule,
      ]
    );
    return result.rows[0];
  }

  // src/infrastructure/repositories/Appointment/AppointmentRepositoryImpl.js
  async updateAppointment(appointmentid, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }

    // Always update updatedat
    fields.push(`updatedat = CURRENT_TIMESTAMP`);

    const query = `
    UPDATE appointment
    SET ${fields.join(", ")}
    WHERE appointmentid = $${idx}
    RETURNING *
  `;
    values.push(appointmentid);

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ✅ Delete appointment
  async deleteAppointment(appointmentid) {
    const result = await pool.query(
      `DELETE FROM appointment WHERE appointmentid = $1 RETURNING *`,
      [appointmentid]
    );
    return result.rows[0];
  }

  // ✅ Select / get appointments (optionally by staff or customer)
  async getAppointments({ staffid = null, customerid = null } = {}) {
    let query = `SELECT * FROM appointment WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (staffid) {
      query += ` AND staffid = $${idx++}`;
      params.push(staffid);
    }

    if (customerid) {
      query += ` AND customerid = $${idx++}`;
      params.push(customerid);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }
}
