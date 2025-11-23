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

  // Create appointment with multiple services
  async createAppointment({
    customerid,
    starttime,
    endtime,
    staffid,
    notes,
    priority,
    status,
    recurring,
    recurrencerule,
    services,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN"); // start transaction

      // 1️⃣ Insert appointment (without serviceid)
      const appointmentRes = await client.query(
        `INSERT INTO appointment 
          (customerid, starttime, endtime, staffid, notes, priority, status, recurring, recurrencerule)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *`,
        [
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
      const appointment = appointmentRes.rows[0];
      const appointmentId = appointment.appointmentid;

      // 2️⃣ Insert services into AppointmentService
      const serviceInsertQuery = `
        INSERT INTO appointmentservice (appointmentid, serviceid, quantity, price)
        VALUES ($1, $2, $3, $4)
      `;

      for (const svc of services) {
        await client.query(serviceInsertQuery, [
          appointmentId,
          svc.serviceid,
          svc.quantity || 1,
          svc.price || null,
        ]);
      }

      await client.query("COMMIT");
      return appointment;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
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
