import { pool } from "../../db/index.js";

export default class ReservationPaymentRepositoryImpl {
  /**
   * Create a new reservation payment record
   */
  async createReservationPayment(data, client = null) {
    const db = client || pool;
    const result = await db.query(
      `INSERT INTO reservationpayment
        (appointmentid, queueid, customerid, reference_code, method, status, currency,
         reservation_fee, checkout_url, paymongo_id, paymongo_payment_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        data.appointmentid || null,
        data.queueid || null,
        data.customerid || null,
        data.reference_code,
        data.method || "gcash",
        data.status || "pending",
        data.currency || "PHP",
        data.reservation_fee,
        data.checkout_url || null,
        data.paymongo_id || null,
        data.paymongo_payment_id || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * Mark reservation payment as paid by PayMongo session ID
   */
  async markPaidBySessionId(sessionId, paymentId = null) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Find the reservation payment (check appointmentid OR queueid for totals)
      const paymentRes = await client.query(
        `SELECT rp.*,
                CASE 
                  WHEN rp.appointmentid IS NOT NULL THEN COALESCE(apt_totals.total_service_cost, 0)
                  WHEN rp.queueid IS NOT NULL THEN COALESCE(q_totals.total_service_cost, 0)
                  ELSE 0
                END AS total_amount
         FROM reservationpayment rp
         LEFT JOIN (
             SELECT aps.appointmentid, SUM(sv.amount) AS total_service_cost
             FROM appointmentservice aps
             JOIN service sv ON sv.serviceid = aps.serviceid
             GROUP BY aps.appointmentid
         ) apt_totals ON apt_totals.appointmentid = rp.appointmentid
         LEFT JOIN (
             SELECT qs.queueid, SUM(sv.amount) AS total_service_cost
             FROM queueservice qs
             JOIN service sv ON sv.serviceid = qs.serviceid
             GROUP BY qs.queueid
         ) q_totals ON q_totals.queueid = rp.queueid
         WHERE rp.paymongo_id = $1`,
        [sessionId]
      );

      if (!paymentRes.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      const payment = paymentRes.rows[0];

      // 2. Mark payment as paid
      await client.query(
        `UPDATE reservationpayment 
         SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP,
             paymongo_payment_id = COALESCE($2, paymongo_payment_id)
         WHERE reservationpaymentid = $1`,
        [payment.reservationpaymentid, paymentId]
      );

      // 3. Update appointment status if it exists
      if (payment.appointmentid) {
        await client.query(
          `UPDATE appointment
           SET status = 'paid', updatedat = CURRENT_TIMESTAMP
           WHERE appointmentid = $1`,
          [payment.appointmentid]
        );
      }

      // 4. Update queue status if it exists (for walk-ins or appointments)
      const linkColumn = payment.appointmentid ? 'appointmentid' : 'queueid';
      const linkValue = payment.appointmentid || payment.queueid;

      // If it's a walk-in, we mark the queue status as 'done' because they paid 100%
      const statusUpdate = !payment.appointmentid ? ", status = 'done'" : "";

      await client.query(
        `UPDATE queue
         SET updatedat = CURRENT_TIMESTAMP ${statusUpdate}
         WHERE ${linkColumn} = $1`,
        [linkValue]
      );

      await client.query("COMMIT");
      return payment;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("ReservationPayment markPaidBySessionId error:", err);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Get all reservation payments for an appointment ID
   */
  async getPaymentsByAppointmentId(appointmentid) {
    const result = await pool.query(
      `SELECT rp.*,
              COALESCE(totals.total_service_cost, 0) AS total_amount,
              (COALESCE(totals.total_service_cost, 0) - rp.reservation_fee) AS balance_amount
       FROM reservationpayment rp
       LEFT JOIN (
           SELECT aps.appointmentid, SUM(sv.amount) AS total_service_cost
           FROM appointmentservice aps
           JOIN service sv ON sv.serviceid = aps.serviceid
           GROUP BY aps.appointmentid
       ) totals ON totals.appointmentid = rp.appointmentid
       WHERE rp.appointmentid = $1
       ORDER BY rp.created_at DESC`,
      [appointmentid]
    );
    return result.rows;
  }

  /**
   * Get reservation payment by appointment ID (single)
   */
  async getByAppointmentId(appointmentid) {
    const payments = await this.getPaymentsByAppointmentId(appointmentid);
    return payments[0] || null;
  }

  /**
   * Get reservation payment by queue ID (for walk-ins)
   */
  async getByQueueId(queueid) {
    const result = await pool.query(
      `SELECT rp.*,
              COALESCE(totals.total_service_cost, 0) AS total_amount,
              (COALESCE(totals.total_service_cost, 0) - rp.reservation_fee) AS balance_amount
       FROM reservationpayment rp
       LEFT JOIN (
           SELECT qs.queueid, SUM(sv.amount) AS total_service_cost
           FROM queueservice qs
           JOIN service sv ON sv.serviceid = qs.serviceid
           GROUP BY qs.queueid
       ) totals ON totals.queueid = rp.queueid
       WHERE rp.queueid = $1`,
      [queueid]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all reservation payments for a customer (join through appointment)
   */
  async getByCustomerId(customerid) {
    const result = await pool.query(
      `SELECT rp.*, 
              a.starttime, a.endtime, a.status AS appointment_status, a.customerid,
              s.firstname AS staff_firstname, s.lastname AS staff_lastname,
              COALESCE(totals.total_service_cost, 0) AS total_amount,
              (COALESCE(totals.total_service_cost, 0) - rp.reservation_fee) AS balance_amount
       FROM reservationpayment rp
       JOIN appointment a ON a.appointmentid = rp.appointmentid
       LEFT JOIN staff s ON s.staffid = a.staffid
       LEFT JOIN (
           SELECT aps.appointmentid, SUM(sv.amount) AS total_service_cost
           FROM appointmentservice aps
           JOIN service sv ON sv.serviceid = aps.serviceid
           GROUP BY aps.appointmentid
       ) totals ON totals.appointmentid = rp.appointmentid
       WHERE a.customerid = $1
       ORDER BY rp.created_at DESC`,
      [customerid]
    );
    return result.rows;
  }

  /**
   * Get all reservation payments (admin view)
   */
  async getAll() {
    const result = await pool.query(
      `SELECT rp.*,
              a.starttime, a.endtime, a.status AS appointment_status,
              COALESCE(a.customerid, q.customerid) AS customerid,
              COALESCE(c.firstname, q.customername, 'Walk-in Customer') AS customer_firstname,
              COALESCE(c.lastname, '') AS customer_lastname,
              u.email AS customer_email,
              COALESCE(s.firstname, qs_staff.firstname) AS staff_firstname, 
              COALESCE(s.lastname, qs_staff.lastname) AS staff_lastname,
              COALESCE(apt_totals.total_service_cost, q_totals.total_service_cost, 0) AS total_amount,
              CASE 
                WHEN rp.appointmentid IS NOT NULL THEN (COALESCE(apt_totals.total_service_cost, 0) - rp.reservation_fee)
                ELSE COALESCE(q_totals.total_service_cost, 0)
              END AS balance_amount,
              COALESCE(apt_totals.service_names, q_totals.service_names) AS service_names
       FROM reservationpayment rp
       LEFT JOIN appointment a ON a.appointmentid = rp.appointmentid
       LEFT JOIN queue q ON q.queueid = rp.queueid
       LEFT JOIN customers c ON c.customerid = a.customerid
       LEFT JOIN users u ON u.userid = c.userid
       LEFT JOIN staff s ON s.staffid = a.staffid
       LEFT JOIN staff qs_staff ON qs_staff.staffid = q.staffid
       LEFT JOIN (
           SELECT aps.appointmentid, 
                  SUM(sv.amount) AS total_service_cost,
                  STRING_AGG(sv.servicename, ', ') AS service_names
           FROM appointmentservice aps
           JOIN service sv ON sv.serviceid = aps.serviceid
           GROUP BY aps.appointmentid
       ) apt_totals ON apt_totals.appointmentid = rp.appointmentid
       LEFT JOIN (
           SELECT qs.queueid, 
                  SUM(sv.amount) AS total_service_cost,
                  STRING_AGG(sv.servicename, ', ') AS service_names
           FROM queueservice qs
           JOIN service sv ON sv.serviceid = qs.serviceid
           GROUP BY qs.queueid
       ) q_totals ON q_totals.queueid = rp.queueid
       ORDER BY rp.created_at DESC`
    );
    return result.rows;
  }

  /**
   * Get multiple services by their IDs
   */
  async getServicesByIds(serviceIds) {
    if (!serviceIds || serviceIds.length === 0) return [];
    const result = await pool.query(
      `SELECT * FROM service WHERE serviceid = ANY($1::int[])`,
      [serviceIds]
    );
    return result.rows;
  }

  /**
   * Get customer info with email for PayMongo billing (via appointment)
   */
  async getCustomerWithEmail(customerid) {
    const result = await pool.query(
      `SELECT c.firstname, c.lastname, c.contact, u.email
       FROM customers c
       LEFT JOIN users u ON u.userid = c.userid
       WHERE c.customerid = $1`,
      [customerid]
    );
    return result.rows[0];
  }

  /**
   * Get services for an appointment (with prices)
   */
  async getAppointmentServices(appointmentid) {
    const result = await pool.query(
      `SELECT aps.serviceid, sv.amount AS price,
              sv.servicename, sv.servicetype
       FROM appointmentservice aps
       JOIN service sv ON sv.serviceid = aps.serviceid
       WHERE aps.appointmentid = $1`,
      [appointmentid]
    );
    return result.rows;
  }

  /**
   * Get customerid from appointment
   */
  async getCustomerIdByAppointment(appointmentid) {
    const result = await pool.query(
      `SELECT customerid FROM appointment WHERE appointmentid = $1`,
      [appointmentid]
    );
    return result.rows[0]?.customerid || null;
  }

  /**
   * Update payment record with balance checkout info
   */
  async updateBalanceInfo(reservationpaymentid, data) {
    const result = await pool.query(
      `UPDATE reservationpayment
       SET balance_paymongo_id = $1,
           balance_checkout_url = $2,
           balance_status = 'pending',
           updated_at = CURRENT_TIMESTAMP
       WHERE reservationpaymentid = $3
       RETURNING appointmentid`,
      [
        data.balance_paymongo_id,
        data.balance_checkout_url,
        reservationpaymentid,
      ]
    );
    if (result.rows.length === 0) return null;
    return this.getByAppointmentId(result.rows[0].appointmentid);
  }

  /**
   * Mark balance as paid and finalize appointment/queue
   */
  async markBalancePaid(balanceSessionId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Find the record (check appointmentid OR queueid for totals)
      const paymentRes = await client.query(
        `SELECT rp.*,
                CASE 
                  WHEN rp.appointmentid IS NOT NULL THEN COALESCE(apt_totals.total_service_cost, 0)
                  WHEN rp.queueid IS NOT NULL THEN COALESCE(q_totals.total_service_cost, 0)
                  ELSE 0
                END AS total_amount
         FROM reservationpayment rp
         LEFT JOIN (
             SELECT aps.appointmentid, SUM(sv.amount) AS total_service_cost
             FROM appointmentservice aps
             JOIN service sv ON sv.serviceid = aps.serviceid
             GROUP BY aps.appointmentid
         ) apt_totals ON apt_totals.appointmentid = rp.appointmentid
         LEFT JOIN (
             SELECT qs.queueid, SUM(sv.amount) AS total_service_cost
             FROM queueservice qs
             JOIN service sv ON sv.serviceid = qs.serviceid
             GROUP BY qs.queueid
         ) q_totals ON q_totals.queueid = rp.queueid
         WHERE rp.balance_paymongo_id = $1`,
        [balanceSessionId]
      );

      if (!paymentRes.rows.length) {
        await client.query("ROLLBACK");
        return null;
      }

      const payment = paymentRes.rows[0];

      // 2. Mark balance as paid
      await client.query(
        `UPDATE reservationpayment 
         SET balance_status = 'paid', 
             balance_paid_at = CURRENT_TIMESTAMP, 
             updated_at = CURRENT_TIMESTAMP
         WHERE reservationpaymentid = $1`,
        [payment.reservationpaymentid]
      );

      // 3. Update appointment status if it exists
      if (payment.appointmentid) {
        await client.query(
          `UPDATE appointment
           SET status = 'completed', updatedat = CURRENT_TIMESTAMP
           WHERE appointmentid = $1`,
          [payment.appointmentid]
        );
      }

      // 4. Update queue status to done (if it exists)
      const linkColumn = payment.appointmentid ? 'appointmentid' : 'queueid';
      const linkValue = payment.appointmentid || payment.queueid;

      await client.query(
        `UPDATE queue
         SET status = 'done', updatedat = CURRENT_TIMESTAMP
         WHERE ${linkColumn} = $1`,
        [linkValue]
      );

      await client.query("COMMIT");
      return payment;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("markBalancePaid error:", err);
      return null;
    } finally {
      client.release();
    }
  }
  /**
   * Mark reservation as paid manually (staff/admin)
   */
  async markReservationPaidManually(appointmentid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const payment = await this.getByAppointmentId(appointmentid);
      if (!payment) throw new Error("Payment record not found");

      await client.query(
        `UPDATE reservationpayment 
         SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE reservationpaymentid = $1`,
        [payment.reservationpaymentid]
      );

      await client.query(
        `UPDATE appointment
         SET status = 'paid', updatedat = CURRENT_TIMESTAMP
         WHERE appointmentid = $1`,
        [appointmentid]
      );

      await client.query("COMMIT");
      return this.getByAppointmentId(appointmentid);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Mark balance as paid manually (staff/admin)
   */
  async markBalancePaidManually(appointmentid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const payment = await this.getByAppointmentId(appointmentid);
      if (!payment) throw new Error("Payment record not found");

      await client.query(
        `UPDATE reservationpayment 
         SET balance_status = 'paid', 
             balance_paid_at = CURRENT_TIMESTAMP, 
             updated_at = CURRENT_TIMESTAMP
         WHERE reservationpaymentid = $1`,
        [payment.reservationpaymentid]
      );

      await client.query(
        `UPDATE appointment
         SET status = 'completed', updatedat = CURRENT_TIMESTAMP
         WHERE appointmentid = $1`,
        [appointmentid]
      );

      await client.query(
        `UPDATE queue
         SET status = 'done', updatedat = CURRENT_TIMESTAMP
         WHERE appointmentid = $1`,
        [appointmentid]
      );

      await client.query("COMMIT");
      return this.getByAppointmentId(appointmentid);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  /**
   * Mark reservation as refunded (staff/admin)
   */
  async markRefundedByAppointmentId(appointmentid) {
    const result = await pool.query(
      `UPDATE reservationpayment 
       SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
       WHERE appointmentid = $1
       RETURNING *`,
      [appointmentid]
    );
    return result.rows[0];
  }
}
