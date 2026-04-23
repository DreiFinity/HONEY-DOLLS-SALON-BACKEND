import { pool } from "../../db/index.js";

export default class ReservationPaymentRepositoryImpl {
  /**
   * Create a new reservation payment record
   */
  async createReservationPayment(data) {
    const result = await pool.query(
      `INSERT INTO reservationpayment
        (appointmentid, customerid, reference_code, method, status, currency,
         reservation_fee, checkout_url, paymongo_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING appointmentid`,
      [
        data.appointmentid,
        data.customerid,
        data.reference_code,
        data.method || "gcash",
        data.status || "pending",
        data.currency || "PHP",
        data.reservation_fee,
        data.checkout_url || null,
        data.paymongo_id || null,
      ]
    );
    return this.getByAppointmentId(result.rows[0].appointmentid);
  }

  /**
   * Mark reservation payment as paid by PayMongo session ID
   */
  async markPaidBySessionId(sessionId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Find the reservation payment
      const paymentRes = await client.query(
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
         SET status = 'paid', paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE reservationpaymentid = $1`,
        [payment.reservationpaymentid]
      );

      // 3. Update appointment status to 'paid' (staff needs to confirm)
      await client.query(
        `UPDATE appointment
         SET status = 'paid', updatedat = CURRENT_TIMESTAMP
         WHERE appointmentid = $1`,
        [payment.appointmentid]
      );

      await client.query("COMMIT");
      return this.getByAppointmentId(payment.appointmentid);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("ReservationPayment markPaidBySessionId error:", err);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Get reservation payment by appointment ID
   */
  async getByAppointmentId(appointmentid) {
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
       WHERE rp.appointmentid = $1`,
      [appointmentid]
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
              a.starttime, a.endtime, a.status AS appointment_status, a.customerid,
              c.firstname AS customer_firstname, c.lastname AS customer_lastname,
              u.email AS customer_email,
              s.firstname AS staff_firstname, s.lastname AS staff_lastname,
              COALESCE(totals.total_service_cost, 0) AS total_amount,
              (COALESCE(totals.total_service_cost, 0) - rp.reservation_fee) AS balance_amount,
              totals.service_names
       FROM reservationpayment rp
       JOIN appointment a ON a.appointmentid = rp.appointmentid
       JOIN customers c ON c.customerid = a.customerid
       LEFT JOIN users u ON u.userid = c.userid
       LEFT JOIN staff s ON s.staffid = a.staffid
       LEFT JOIN (
           SELECT aps.appointmentid, 
                  SUM(sv.amount) AS total_service_cost,
                  STRING_AGG(sv.servicename, ', ') AS service_names
           FROM appointmentservice aps
           JOIN service sv ON sv.serviceid = aps.serviceid
           GROUP BY aps.appointmentid
       ) totals ON totals.appointmentid = rp.appointmentid
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

      // 1. Find the record
      const paymentRes = await client.query(
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

      // 3. Update appointment status to completed
      await client.query(
        `UPDATE appointment
         SET status = 'completed', updatedat = CURRENT_TIMESTAMP
         WHERE appointmentid = $1`,
        [payment.appointmentid]
      );

      // 4. Update queue status to done (if it exists)
      await client.query(
        `UPDATE queue
         SET status = 'done', updatedat = CURRENT_TIMESTAMP
         WHERE appointmentid = $1`,
        [payment.appointmentid]
      );

      await client.query("COMMIT");
      return this.getByAppointmentId(payment.appointmentid);
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
}
