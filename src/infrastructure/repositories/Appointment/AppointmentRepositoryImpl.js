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
    services,
    branchid,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const targetBranchId = branchid;
      const values = [
        customerid,
        starttime,
        endtime,
        staffid,
        notes,
        priority,
        status || "pending",
        targetBranchId,
      ];

      console.log("DEBUG Repository createAppointment targetBranchId:", targetBranchId);

      const appointmentRes = await client.query(
        `INSERT INTO appointment 
          (customerid, starttime, endtime, staffid, notes, priority, status, branchid)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8::INTEGER)
        RETURNING *`,
        values
      );

      const appointment = appointmentRes.rows[0];
      const appointmentId = appointment.appointmentid;

      const serviceInsertQuery = `
        INSERT INTO appointmentservice (appointmentid, serviceid)
        VALUES ($1, $2)
      `;

      for (const svc of services) {
        await client.query(serviceInsertQuery, [
          appointmentId,
          svc.serviceid,
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

  async getAppointments({ staffid = null, customerid = null, branchid = null } = {}) {
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

    if (branchid) {
      whereClause += ` AND a.branchid = $${idx++}`;
      params.push(branchid);
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
        a.noshow,
        a.branchid,
        b.branchname,
        s.firstname,
        s.lastname,
        c.firstname AS customer_firstname,
        c.lastname AS customer_lastname,
        CONCAT(c.firstname, ' ', c.lastname) AS customername,
        STRING_AGG(DISTINCT rp.reference_code, ', ') AS reference_code,
        COALESCE(totals.total_service_cost, 0) AS total_amount,
        (COALESCE(totals.total_service_cost, 0) - COALESCE(rp.reservation_fee, 0)) AS balance_amount,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'serviceid', sv.serviceid,
              'servicename', sv.servicename,
              'servicetype', sv.servicetype,
              'price', sv.amount
            )
          ) FILTER (WHERE sv.serviceid IS NOT NULL),
          '[]'
        ) AS services
      FROM appointment a
      LEFT JOIN branch b ON a.branchid = b.branchid
      LEFT JOIN staff s 
        ON a.staffid = s.staffid
      LEFT JOIN customers c
        ON a.customerid = c.customerid
      LEFT JOIN (
          SELECT aps.appointmentid, SUM(sv.amount) AS total_service_cost
          FROM appointmentservice aps
          JOIN service sv ON sv.serviceid = aps.serviceid
          GROUP BY aps.appointmentid
      ) totals ON totals.appointmentid = a.appointmentid
      LEFT JOIN reservationpayment rp
        ON rp.appointmentid = a.appointmentid
      LEFT JOIN appointmentservice aps 
        ON aps.appointmentid = a.appointmentid
      LEFT JOIN service sv 
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
        a.checkedin,
        a.noshow,
        a.branchid,
        b.branchname,
        s.firstname,
        s.lastname,
        c.firstname,
        c.lastname,
        rp.reservation_fee,
        totals.total_service_cost
      ORDER BY a.starttime DESC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }
}