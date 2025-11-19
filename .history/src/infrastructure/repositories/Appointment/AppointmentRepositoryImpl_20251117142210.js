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
}
