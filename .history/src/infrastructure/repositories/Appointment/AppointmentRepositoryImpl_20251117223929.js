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

  // ✅ Update / reschedule appointment
  async updateAppointment(
    appointmentid,
    { starttime, endtime, staffid, notes, priority, status }
  ) {
    const result = await pool.query(
      `UPDATE appointment
       SET starttime = $1, endtime = $2, staffid = $3, notes = $4, priority = $5, status = $6, updatedat = CURRENT_TIMESTAMP
       WHERE appointmentid = $7
       RETURNING *`,
      [starttime, endtime, staffid, notes, priority, status, appointmentid]
    );
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
