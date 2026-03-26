import { pool } from "../../db/index.js";

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
              isarrived
            )
          VALUES
            (CURRENT_DATE, $1, $2, $3, $4, 'appointment', 'waiting', $5, false)
          RETURNING queueid
        `;

        const customerName = `${apt.firstname} ${apt.lastname}`;
        const queueInsertRes = await client.query(queueInsertQuery, [
          apt.customerid,
          apt.appointmentid,
          apt.staffid,
          customerName,
          apt.starttime,
        ]);

        const queueId = queueInsertRes.rows[0].queueid;

        const appointmentServicesQuery = `
          SELECT aps.serviceid, aps.quantity, aps.price
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
                (queueid, serviceid, quantity, price)
              VALUES
                ($1, $2, $3, $4)
            `,
            [queueId, svc.serviceid, svc.quantity || 1, svc.price || null]
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

    try {
      await client.query("BEGIN");

      // Get the appointment details
      const aptQuery = `
        SELECT
          a.appointmentid,
          a.customerid,
          a.staffid,
          a.starttime,
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
        await client.query("COMMIT");
        return; // Already in queue or not confirmed
      }

      const apt = rows[0];

      const queueInsertQuery = `
        INSERT INTO queue
          (queuedate, customerid, appointmentid, staffid, customername, source, status, arrivaltime, isarrived)
        VALUES
          (DATE($1), $2, $3, $4, $5, 'appointment', 'waiting', $1, false)
        RETURNING queueid
      `;

      const customerName = `${apt.firstname} ${apt.lastname}`;
      const queueInsertRes = await client.query(queueInsertQuery, [
        apt.starttime,
        apt.customerid,
        apt.appointmentid,
        apt.staffid,
        customerName,
      ]);

      const queueId = queueInsertRes.rows[0].queueid;

      // Copy appointment services to queue services
      const appointmentServicesQuery = `
        SELECT aps.serviceid, aps.quantity, aps.price
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
          `INSERT INTO queueservice (queueid, serviceid, quantity, price) VALUES ($1, $2, $3, $4)`,
          [queueId, svc.serviceid, svc.quantity || 1, svc.price || null]
        );
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getTodayQueue() {
    await this.syncTodayAppointmentsToQueue();

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
        s.firstname AS staff_firstname,
        s.lastname AS staff_lastname,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'serviceid', sv.serviceid,
              'servicename', sv.servicename,
              'servicetype', sv.servicetype,
              'quantity', qs.quantity,
              'price', qs.price
            )
          ) FILTER (WHERE sv.serviceid IS NOT NULL),
          '[]'
        ) AS services
      FROM queue q
      LEFT JOIN staff s ON q.staffid = s.staffid
      LEFT JOIN queueservice qs ON q.queueid = qs.queueid
      LEFT JOIN service sv ON qs.serviceid = sv.serviceid
      WHERE q.queuedate = CURRENT_DATE
        AND q.status IN ('waiting', 'serving')
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
        s.firstname,
        s.lastname
      ORDER BY
        CASE WHEN q.isarrived = true THEN 0 ELSE 1 END,
        q.arrivaltime ASC
    `;


    const result = await pool.query(query);
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
    WHERE q.queuedate = CURRENT_DATE
    GROUP BY q.queueid, s.firstname, s.lastname
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
            isarrived
          )
        VALUES
          (CURRENT_DATE, $1, $2, 'walkin', 'waiting', CURRENT_TIMESTAMP, $3, true)
        RETURNING *
      `;

      const queueRes = await client.query(insertQueueQuery, [
        customername,
        staffid || null,
        notes || null,
      ]);

      const queue = queueRes.rows[0];

      for (const svc of services) {
        await client.query(
          `
            INSERT INTO queueservice
              (queueid, serviceid, quantity, price)
            VALUES
              ($1, $2, $3, $4)
          `,
          [queue.queueid, svc.serviceid, svc.quantity || 1, svc.price || null]
        );
      }

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
      if (
        updatedQueue &&
        updatedQueue.appointmentid &&
        data.status === "done"
      ) {
        await client.query(
          `
            UPDATE appointment
            SET status = 'completed',
                updatedat = CURRENT_TIMESTAMP
            WHERE appointmentid = $1
          `,
          [updatedQueue.appointmentid]
        );
      }

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
    const result = await pool.query(
      `DELETE FROM queue WHERE queueid = $1 RETURNING *`,
      [queueid]
    );
    return result.rows[0] || null;
  }
}