import { pool } from "../../db/index.js";
import ReservationPaymentRepositoryImpl from "../../repositories/Payment/ReservationPaymentRepositoryImpl.js";
import axios from "axios";
import { config } from "../../../config/env.js";


export default class QueueRepositoryImpl {
  async syncTodayAppointmentsToQueue() {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const todayAppointmentsQuery = `
        SELECT
          a.appointmentid,
          a.customerid,
          a.staffid,
          a.starttime,
          a.branchid,
          c.firstname,
          c.lastname
        FROM appointment a
        INNER JOIN customers c ON a.customerid = c.customerid
        WHERE DATE(a.starttime) = CURRENT_DATE
          AND a.status = 'confirmed'
          AND NOT EXISTS (
            SELECT 1
            FROM queue q
            WHERE q.appointmentid = a.appointmentid
              AND q.queuedate = CURRENT_DATE
          )
      `;

      const { rows: appointments } = await client.query(todayAppointmentsQuery);

      for (const apt of appointments) {
        const queueInsertQuery = `
          INSERT INTO queue
            (
              queuedate,
              customerid,
              appointmentid,
              staffid,
              customername,
              source,
              status,
              arrivaltime,
              isarrived,
              branchid
            )
          VALUES
            (CURRENT_DATE, $1, $2, $3, $4, 'appointment', 'waiting', CURRENT_TIMESTAMP, true, $5)
          RETURNING queueid
        `;

        const customerName = `${apt.firstname} ${apt.lastname}`;
        const queueInsertRes = await client.query(queueInsertQuery, [
          apt.customerid,
          apt.appointmentid,
          apt.staffid,
          customerName,
          apt.branchid,
        ]);

        const queueId = queueInsertRes.rows[0].queueid;

        const appointmentServicesQuery = `
          SELECT aps.serviceid
          FROM appointmentservice aps
          INNER JOIN service sv ON aps.serviceid = sv.serviceid
          WHERE aps.appointmentid = $1
        `;

        const { rows: apptServices } = await client.query(
          appointmentServicesQuery,
          [apt.appointmentid]
        );

        for (const svc of apptServices) {
          await client.query(
            `
              INSERT INTO queueservice
                (queueid, serviceid)
              VALUES
                ($1, $2)
            `,
            [queueId, svc.serviceid]
          );
        }
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async syncAppointmentToQueue(appointmentId) {
    const client = await pool.connect();
    console.log(`DEBUG: syncAppointmentToQueue called for ID: ${appointmentId}`);

    try {
      await client.query("BEGIN");

      // Get the appointment details
      const aptQuery = `
        SELECT
          a.appointmentid,
          a.customerid,
          a.staffid,
          a.starttime,
          a.branchid,
          c.firstname,
          c.lastname
        FROM appointment a
        INNER JOIN customers c ON a.customerid = c.customerid
        WHERE a.appointmentid = $1
          AND a.status = 'confirmed'
          AND NOT EXISTS (
            SELECT 1
            FROM queue q
            WHERE q.appointmentid = a.appointmentid
              AND q.queuedate = DATE(a.starttime)
          )
      `;

      const { rows } = await client.query(aptQuery, [appointmentId]);

      if (rows.length === 0) {
        console.log(`DEBUG: syncAppointmentToQueue - Appointment ${appointmentId} not found, already synced, or not confirmed.`);
        await client.query("COMMIT");
        return;
      }

      const apt = rows[0];
      console.log(`DEBUG: syncAppointmentToQueue - Syncing apt ${appointmentId} for branch ${apt.branchid}`);

      const queueInsertQuery = `
        INSERT INTO queue
          (queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, isarrived, branchid)
        VALUES
          (DATE($1), $2, $3, $4, $5, 'appointment', 'waiting', CURRENT_TIMESTAMP, true, $6)
        RETURNING queueid
      `;

      const customerName = `${apt.firstname} ${apt.lastname}`;
      const queueInsertRes = await client.query(queueInsertQuery, [
        apt.starttime,
        apt.customerid,
        apt.appointmentid,
        apt.staffid,
        customerName,
        apt.branchid,
      ]);

      const queueId = queueInsertRes.rows[0].queueid;
      console.log(`DEBUG: syncAppointmentToQueue - Created queue item ${queueId}`);

      // Copy appointment services to queue services
      const appointmentServicesQuery = `
        SELECT aps.serviceid
        FROM appointmentservice aps
        INNER JOIN service sv ON aps.serviceid = sv.serviceid
        WHERE aps.appointmentid = $1
      `;

      const { rows: apptServices } = await client.query(
        appointmentServicesQuery,
        [apt.appointmentid]
      );

      for (const svc of apptServices) {
        await client.query(
          `INSERT INTO queueservice (queueid, serviceid) VALUES ($1, $2)`,
          [queueId, svc.serviceid]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("DEBUG: syncAppointmentToQueue Error:", err);
      throw err;
    } finally {
      client.release();
    }
  }

  async getTodayQueue(branchid = null) {
    console.log(`DEBUG: getTodayQueue requested for branch: ${branchid}`);
    await this.syncTodayAppointmentsToQueue();

    const params = [];
    let idx = 1;
    let branchFilter = "";
    if (branchid) {
      branchFilter = ` AND q.branchid = $${idx++}`;
      params.push(branchid);
    }

    const query = `
      SELECT
        q.queueid,
        q.customerid,
        q.appointmentid,
        q.staffid,
        q.customername,
        q.source,
        q.status,
        q.arrivaltime,
        q.isarrived,
        q.calledat,
        q.servicestartat,
        q.serviceendat,
        q.priorityweight,
        q.positionoverride,
        q.notes,
        q.createdat,
        q.updatedat,
        q.branchid,
        a.starttime AS appointment_time,
        s.firstname AS staff_firstname,
        s.lastname AS staff_lastname,
        rs.checkout_url AS balance_checkout_url,
        rp.status AS payment_status,
        rp.reservation_fee,
        rs.status AS balance_status,
        rp.reservationpaymentid,
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
      FROM queue q
      LEFT JOIN staff s ON q.staffid = s.staffid
      LEFT JOIN queueservice qs ON q.queueid = qs.queueid
      LEFT JOIN service sv ON qs.serviceid = sv.serviceid
      LEFT JOIN reservationpayment rp ON (
        (q.appointmentid IS NOT NULL AND q.appointmentid = rp.appointmentid) OR
        (q.appointmentid IS NULL AND q.queueid = rp.queueid)
      )
      LEFT JOIN settlement_items si ON rp.reservationpaymentid = si.reservationpaymentid
      LEFT JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
      LEFT JOIN appointment a ON q.appointmentid = a.appointmentid
      WHERE q.queuedate = CURRENT_DATE
        AND q.status IN ('waiting', 'serving', 'pending_payment')
        ${branchFilter}
      GROUP BY
        q.queueid,
        q.customerid,
        q.appointmentid,
        q.staffid,
        q.customername,
        q.source,
        q.status,
        q.arrivaltime,
        q.isarrived,
        q.calledat,
        q.servicestartat,
        q.serviceendat,
        q.priorityweight,
        q.positionoverride,
        q.notes,
        q.createdat,
        q.updatedat,
        q.branchid,
        a.starttime,
        s.firstname,
        s.lastname,
        rp.checkout_url,
        rs.checkout_url,
        rp.status,
        rp.reservation_fee,
        rs.status,
        rp.reservationpaymentid
      ORDER BY
        CASE WHEN q.isarrived = true THEN 0 ELSE 1 END,
        q.arrivaltime ASC
    `;


    const result = await pool.query(query, params);
    return result.rows;
  }

  async getUpcomingQueue(branchid = null) {
    const params = [];
    let idx = 1;
    let branchFilter = "";
    if (branchid) {
      branchFilter = ` AND q.branchid = $${idx++}`;
      params.push(branchid);
    }

    const query = `
      SELECT
        q.queueid,
        q.queuedate,
        q.customerid,
        q.appointmentid,
        q.staffid,
        q.customername,
        q.source,
        q.status,
        q.arrivaltime,
        q.isarrived,
        q.branchid,
        s.firstname AS staff_firstname,
        s.lastname AS staff_lastname,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'serviceid', sv.serviceid,
              'servicename', sv.servicename,
              'price', sv.amount
            )
          ) FILTER (WHERE sv.serviceid IS NOT NULL),
          '[]'
        ) AS services
      FROM queue q
      LEFT JOIN staff s ON q.staffid = s.staffid
      LEFT JOIN queueservice qs ON q.queueid = qs.queueid
      LEFT JOIN service sv ON qs.serviceid = sv.serviceid
      WHERE q.queuedate > CURRENT_DATE
        AND q.status = 'waiting'
        ${branchFilter}
      GROUP BY
        q.queueid, s.firstname, s.lastname
      ORDER BY
        q.queuedate ASC, q.arrivaltime ASC
    `;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTodayQueueAdmin() {
    await this.syncTodayAppointmentsToQueue();

    const query = `
    SELECT
      q.queueid,
      q.customername,
      q.source,
      q.status,
      q.arrivaltime,
      q.isarrived,
      q.staffid,
      q.branchid,
      a.starttime AS appointment_time,
      s.firstname AS staff_firstname,
      s.lastname AS staff_lastname,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'serviceid', sv.serviceid,
            'servicename', sv.servicename
          )
        ) FILTER (WHERE sv.serviceid IS NOT NULL),
        '[]'
      ) AS services
    FROM queue q
    LEFT JOIN staff s ON q.staffid = s.staffid
    LEFT JOIN queueservice qs ON q.queueid = qs.queueid
    LEFT JOIN service sv ON qs.serviceid = sv.serviceid
    LEFT JOIN appointment a ON q.appointmentid = a.appointmentid
    WHERE q.queuedate = CURRENT_DATE
    GROUP BY q.queueid, q.branchid, s.firstname, s.lastname, a.starttime
    ORDER BY q.arrivaltime ASC
  `;

    const result = await pool.query(query);
    return result.rows;
  }

  async createWalkIn({
    customername,
    staffid = null,
    notes = null,
    services = [],
    branchid = null,
  }) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const insertQueueQuery = `
        INSERT INTO queue
          (
            queuedate,
            customername,
            staffid,
            source,
            status,
            arrivaltime,
            notes,
            isarrived,
            branchid
          )
        VALUES
          (CURRENT_DATE, $1, $2, 'walkin', 'waiting', CURRENT_TIMESTAMP, $3, true, $4)
        RETURNING *
      `;

      const queueRes = await client.query(insertQueueQuery, [
        customername,
        staffid || null,
        notes || null,
        branchid || null,
      ]);

      const queue = queueRes.rows[0];

      // ---------- Walk‑in total amount calculation ----------
      // Fetch service prices from DB to avoid trusting client payload
      const serviceIds = services.map(s => s.serviceid);
      const serviceRes = await client.query(
        `SELECT serviceid, amount, servicename FROM service WHERE serviceid = ANY($1::int[])`,
        [serviceIds]
      );
      const priceMap = {};
      serviceRes.rows.forEach(row => {
        priceMap[row.serviceid] = Number(row.amount);
      });

      let totalAmount = 0;
      for (const svc of services) {
        // Insert the relation between queue and service
        await client.query(
          `
            INSERT INTO queueservice
              (queueid, serviceid)
            VALUES
              ($1, $2)
          `,
          [queue.queueid, svc.serviceid]
        );

        const price = priceMap[svc.serviceid] || 0;
        const qty = Number(svc.quantity) || 1; // default to 1 if not provided or NaN
        totalAmount += price * qty;
      }

      // ---------- Walk‑in payment placeholder ----------
      // For walk-ins, we do NOT charge a deposit/reservation fee upfront.
      // We create a reservationpayment record with 0 fee so it can be tracked in the settlement system.
      const reference_code = `WALK-${Math.floor(100000 + Math.random() * 900000)}`;

      const reservationRepo = new ReservationPaymentRepositoryImpl();
      await reservationRepo.createReservationPayment({
        appointmentid: null,
        queueid: queue.queueid,
        customerid: null,
        reference_code,
        method: "cash", // Default to cash placeholder for walk-ins
        status: "pending",
        currency: "PHP",
        reservation_fee: 0, // Walk-ins have 0 deposit
        checkout_url: null,
        paymongo_id: null,
      }, client);

      await client.query("COMMIT");
      return queue;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateQueue(queueid, data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existingRes = await client.query(
        `SELECT * FROM queue WHERE queueid = $1`,
        [queueid]
      );

      if (existingRes.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const existingQueue = existingRes.rows[0];

      const fields = [];
      const values = [];
      let idx = 1;

      for (const [key, value] of Object.entries(data)) {
        fields.push(`${key} = $${idx++}`);
        values.push(value);
      }

      fields.push(`updatedat = CURRENT_TIMESTAMP`);

      const updateQueueQuery = `
        UPDATE queue
        SET ${fields.join(", ")}
        WHERE queueid = $${idx}
        RETURNING *
      `;
      values.push(queueid);

      const queueResult = await client.query(updateQueueQuery, values);
      const updatedQueue = queueResult.rows[0];

      // 🔥 If this queue row came from an appointment and queue is done,
      // also mark appointment as completed
      if (updatedQueue && updatedQueue.appointmentid) {
        if (data.status === "done") {
          await client.query(
            `UPDATE appointment SET status = 'completed', updatedat = CURRENT_TIMESTAMP WHERE appointmentid = $1`,
            [updatedQueue.appointmentid]
          );

          // Settlement Logic: If transitioning to done, ensure payment is marked as paid
          const paymentRes = await client.query(
            `SELECT rp.reservationpaymentid, rs.settlementid 
             FROM reservationpayment rp
             LEFT JOIN settlement_items si ON rp.reservationpaymentid = si.reservationpaymentid
             LEFT JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
             WHERE rp.appointmentid = $1`,
            [updatedQueue.appointmentid]
          );
          if (paymentRes.rows.length > 0) {
            const payment = paymentRes.rows[0];
            // Mark the reservation part as paid if not already
            await client.query(
              `UPDATE reservationpayment SET status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE reservationpaymentid = $1`,
              [payment.reservationpaymentid]
            );
            
            // Mark the settlement as paid if it exists
            if (payment.settlementid) {
              await client.query(
                `UPDATE reservation_settlements SET status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE settlementid = $1`,
                [payment.settlementid]
              );
            }
          }
        }

        // Also sync staffid if it was updated in the queue
        if (data.staffid !== undefined) {
          await client.query(
            `UPDATE appointment SET staffid = $1, updatedat = CURRENT_TIMESTAMP WHERE appointmentid = $2`,
            [data.staffid, updatedQueue.appointmentid]
          );
        }
      } else if (updatedQueue && !updatedQueue.appointmentid && data.status === "done") {
        // Walk-in Settlement Logic
        const paymentRes = await client.query(
          `SELECT rp.reservationpaymentid, rs.settlementid 
           FROM reservationpayment rp
           LEFT JOIN settlement_items si ON rp.reservationpaymentid = si.reservationpaymentid
           LEFT JOIN reservation_settlements rs ON si.settlementid = rs.settlementid
           WHERE rp.queueid = $1`,
          [updatedQueue.queueid]
        );
        if (paymentRes.rows.length > 0) {
          const payment = paymentRes.rows[0];
          // Mark the reservation part as paid if not already
          await client.query(
            `UPDATE reservationpayment SET status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE reservationpaymentid = $1`,
            [payment.reservationpaymentid]
          );
          
          // Mark the settlement as paid if it exists
          if (payment.settlementid) {
            await client.query(
              `UPDATE reservation_settlements SET status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE settlementid = $1`,
              [payment.settlementid]
            );
          }
        }
      }

      // AUTO-SUBSTITUTE LOGIC — DISABLED
      // Staff must manually start serving the next customer via the SERVE button.
      // This allows staff to take breaks between services.
      // if (data.status === "pending_payment" && updatedQueue.staffid) { ... }

      await client.query("COMMIT");
      return updatedQueue;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteQueue(queueid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Get the queue item to find appointmentid
      const res = await client.query(
        `SELECT appointmentid FROM queue WHERE queueid = $1`,
        [queueid]
      );

      const appointmentid = res.rows[0]?.appointmentid;

      // 2. Delete the queue item
      const deleteQueueRes = await client.query(
        `DELETE FROM queue WHERE queueid = $1 RETURNING *`,
        [queueid]
      );

      // 3. If it was linked to an appointment, mark it as cancelled
      if (appointmentid) {
        await client.query(
          `UPDATE appointment 
           SET status = 'cancelled', 
               cancellationreason = 'Removed from queue by staff',
               updatedat = CURRENT_TIMESTAMP
           WHERE appointmentid = $1`,
          [appointmentid]
        );
      }

      await client.query("COMMIT");
      return deleteQueueRes.rows[0] || null;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getById(queueid) {
    const res = await pool.query(`SELECT * FROM queue WHERE queueid = $1`, [queueid]);
    return res.rows[0];
  }
}