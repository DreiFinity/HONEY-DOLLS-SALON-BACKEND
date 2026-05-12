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
      WITH all_records AS (
        -- Scheduled Appointments
        SELECT 
          a.appointmentid::INTEGER,
          a.customerid::INTEGER,
          a.starttime::TIMESTAMPTZ,
          a.endtime::TIMESTAMPTZ,
          a.staffid::INTEGER,
          a.notes::TEXT,
          a.priority::TEXT,
          a.status::VARCHAR,
          a.noshow::BOOLEAN,
          a.branchid::INTEGER,
          a.cancellationreason::TEXT,
          a.checkedin::BOOLEAN,
          a.updatedat::TIMESTAMPTZ,
          NULL::INTEGER as queueid,
          'appointment'::TEXT as source
        FROM appointment a
        ${whereClause}

        UNION ALL

        -- Walk-ins from Queue
        SELECT 
          NULL::INTEGER as appointmentid,
          q.customerid::INTEGER,
          q.arrivaltime::TIMESTAMPTZ as starttime,
          q.arrivaltime::TIMESTAMPTZ as endtime,
          q.staffid::INTEGER,
          q.notes::TEXT,
          '0'::TEXT as priority,
          q.status::VARCHAR,
          false::BOOLEAN as noshow,
          q.branchid::INTEGER,
          NULL::TEXT as cancellationreason,
          q.isarrived::BOOLEAN as checkedin,
          q.updatedat::TIMESTAMPTZ,
          q.queueid::INTEGER,
          'walkin'::TEXT as source
        FROM queue q
        WHERE q.appointmentid IS NULL
        ${whereClause.replace(/a\./g, 'q.').replace(/appointmentid/g, 'queueid').replace('WHERE', 'AND')} 
      )
      SELECT 
        r.appointmentid,
        r.queueid,
        r.customerid,
        r.starttime,
        r.endtime,
        r.staffid,
        r.notes,
        r.priority,
        r.status,
        r.noshow,
        r.branchid,
        r.source,
        r.updatedat,
        b.branchname,
        s.firstname as staff_firstname,
        s.lastname as staff_lastname,
        COALESCE(c.firstname, SPLIT_PART(q_name.customername, ' ', 1)) AS customer_firstname,
        COALESCE(c.lastname, SPLIT_PART(q_name.customername, ' ', 2)) AS customer_lastname,
        COALESCE(NULLIF(TRIM(CONCAT(c.firstname, ' ', c.lastname)), ''), q_name.customername) AS customername,
        -- Services Subquery
        (
          SELECT COALESCE(JSON_AGG(JSON_BUILD_OBJECT(
            'serviceid', sv.serviceid,
            'servicename', sv.servicename,
            'servicetype', sv.servicetype,
            'price', sv.amount
          )), '[]')
          FROM (
            SELECT serviceid FROM appointmentservice WHERE appointmentid = r.appointmentid AND r.appointmentid IS NOT NULL
            UNION ALL
            SELECT serviceid FROM queueservice WHERE queueid = r.queueid AND r.appointmentid IS NULL
          ) rel
          JOIN service sv ON sv.serviceid = rel.serviceid
        ) AS services,
        -- Total Amount Subquery
        (
          SELECT COALESCE(SUM(sv.amount), 0)
          FROM (
            SELECT serviceid FROM appointmentservice WHERE appointmentid = r.appointmentid AND r.appointmentid IS NOT NULL
            UNION ALL
            SELECT serviceid FROM queueservice WHERE queueid = r.queueid AND r.appointmentid IS NULL
          ) rel
          JOIN service sv ON sv.serviceid = rel.serviceid
        ) AS total_amount,
        -- Payment Subquery
        (
          SELECT COALESCE(STRING_AGG(reference_code, ', '), '')
          FROM reservationpayment
          WHERE (r.appointmentid IS NOT NULL AND appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND queueid = r.queueid)
        ) AS reference_code,
        (
          SELECT MAX(reservationpaymentid)
          FROM reservationpayment
          WHERE (r.appointmentid IS NOT NULL AND appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND queueid = r.queueid)
        ) AS reservationpaymentid,
        (
          SELECT COALESCE(SUM(reservation_fee), 0)
          FROM reservationpayment
          WHERE (r.appointmentid IS NOT NULL AND appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND queueid = r.queueid)
        ) AS reservation_fee,
        (
          SELECT status
          FROM reservationpayment
          WHERE (r.appointmentid IS NOT NULL AND appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND queueid = r.queueid)
          ORDER BY created_at DESC LIMIT 1
        ) AS payment_status,
        (
          SELECT rs.status
          FROM settlement_items si
          JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
          JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
          WHERE (r.appointmentid IS NOT NULL AND rp.appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND rp.queueid = r.queueid)
          ORDER BY rs.created_at DESC LIMIT 1
        ) AS balance_status,
        (
          SELECT rs.method
          FROM settlement_items si
          JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
          JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
          WHERE (r.appointmentid IS NOT NULL AND rp.appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND rp.queueid = r.queueid)
          ORDER BY rs.created_at DESC LIMIT 1
        ) AS balance_method,
        (
          SELECT method
          FROM reservationpayment
          WHERE (r.appointmentid IS NOT NULL AND appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND queueid = r.queueid)
          ORDER BY created_at DESC LIMIT 1
        ) AS payment_method,
        (
          SELECT rs.reference_code
          FROM settlement_items si
          JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
          JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
          WHERE (r.appointmentid IS NOT NULL AND rp.appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND rp.queueid = r.queueid)
          ORDER BY rs.created_at DESC LIMIT 1
        ) AS settlement_ref,
        (
          SELECT rs.settlementid
          FROM settlement_items si
          JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
          JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
          WHERE (r.appointmentid IS NOT NULL AND rp.appointmentid = r.appointmentid)
             OR (r.appointmentid IS NULL AND rp.queueid = r.queueid)
          ORDER BY rs.created_at DESC LIMIT 1
        ) AS settlement_id,
        -- Balance Amount
        CASE 
          WHEN r.source = 'walkin' THEN 
            CASE 
              WHEN EXISTS(SELECT 1 FROM reservationpayment WHERE queueid = r.queueid AND status = 'paid') THEN 0
              ELSE (SELECT COALESCE(SUM(sv.amount), 0) FROM queueservice qs JOIN service sv ON sv.serviceid = qs.serviceid WHERE qs.queueid = r.queueid)
            END
          ELSE 
            (SELECT COALESCE(SUM(sv.amount), 0) FROM appointmentservice aps JOIN service sv ON sv.serviceid = aps.serviceid WHERE aps.appointmentid = r.appointmentid)
            -
            (SELECT COALESCE(SUM(reservation_fee), 0) FROM reservationpayment WHERE appointmentid = r.appointmentid AND status = 'paid')
            -
            (
              SELECT COALESCE(SUM(CASE WHEN rs.status = 'paid' THEN (SELECT SUM(sv.amount) FROM appointmentservice aps JOIN service sv ON sv.serviceid = aps.serviceid WHERE aps.appointmentid = r.appointmentid) - rp.reservation_fee ELSE 0 END), 0)
              FROM reservationpayment rp
              LEFT JOIN settlement_items si ON rp.reservationpaymentid = si.reservationpaymentid
              LEFT JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
              WHERE rp.appointmentid = r.appointmentid
            )
        END AS balance_amount
      FROM all_records r
      LEFT JOIN branch b ON r.branchid = b.branchid
      LEFT JOIN staff s ON r.staffid = s.staffid
      LEFT JOIN customers c ON r.customerid = c.customerid
      LEFT JOIN queue q_name ON r.queueid = q_name.queueid
      ORDER BY r.updatedat DESC, r.starttime DESC, r.appointmentid DESC NULLS LAST, r.queueid DESC NULLS LAST
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }
}