import { pool } from "../../db/index.js";

export class AppointmentRepositoryImpl {
  async findCustomerIdByUserId(userId) {
    const result = await pool.query(
      `SELECT customerid FROM customers WHERE userid = $1`,
      [userId]
    );

    return result.rows[0] ? result.rows[0].customerid : null;
  }

  async findStaffIdByUserId(userId) {
    const result = await pool.query(
      `SELECT staffid FROM staff WHERE userid = $1`,
      [userId]
    );

    return result.rows[0] ? result.rows[0].staffid : null;
  }

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
      await client.query("BEGIN");

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
          status || "pending",
          recurring,
          recurrencerule,
        ]
      );

      const appointment = appointmentRes.rows[0];
      const appointmentId = appointment.appointmentid;

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

  async updateAppointment(appointmentid, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }

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

  async deleteAppointment(appointmentid) {
    const result = await pool.query(
      `DELETE FROM appointment WHERE appointmentid = $1 RETURNING *`,
      [appointmentid]
    );
    return result.rows[0];
  }

  async getAppointments({ staffid = null, customerid = null } = {}) {
    const params = [];
    let idx = 1;

    let whereClause = "WHERE 1=1";

    if (staffid) {
      whereClause += ` AND a.staffid = $${idx++}`;
      params.push(staffid);
    }

    if (customerid) {
      whereClause += ` AND a.customerid = $${idx++}`;
      params.push(customerid);
    }

    const query = `
      SELECT 
        a.appointmentid,
        a.customerid,
        a.starttime,
        a.endtime,
        a.staffid,
        a.notes,
        a.priority,
        a.status,
        a.cancellationreason,
        s.firstname,
        s.lastname,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'serviceid', sv.serviceid,
              'servicename', sv.servicename,
              'servicetype', sv.servicetype,
              'price', aps.price
            )
          ) FILTER (WHERE sv.serviceid IS NOT NULL),
          '[]'
        ) AS services
      FROM appointment a
      LEFT JOIN staff s 
        ON a.staffid = s.staffid
      LEFT JOIN appointmentservice aps 
        ON aps.appointmentid = a.appointmentid
      LEFT JOIN services sv 
        ON aps.serviceid = sv.serviceid
      ${whereClause}
      GROUP BY 
        a.appointmentid,
        a.customerid,
        a.starttime,
        a.endtime,
        a.staffid,
        a.notes,
        a.priority,
        a.status,
        a.cancellationreason,
        s.firstname,
        s.lastname
      ORDER BY a.starttime DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }
}