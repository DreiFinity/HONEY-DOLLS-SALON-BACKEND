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
       RETURNING *`,
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
    return result.rows[0];
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
        `SELECT * FROM reservationpayment WHERE paymongo_id = $1`,
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
   * Get reservation payment by appointment ID
   */
  async getByAppointmentId(appointmentid) {
    const result = await pool.query(
      `SELECT * FROM reservationpayment WHERE appointmentid = $1`,
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
              s.firstname AS staff_firstname, s.lastname AS staff_lastname
       FROM reservationpayment rp
       JOIN appointment a ON a.appointmentid = rp.appointmentid
       LEFT JOIN staff s ON s.staffid = a.staffid
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
              s.firstname AS staff_firstname, s.lastname AS staff_lastname
       FROM reservationpayment rp
       JOIN appointment a ON a.appointmentid = rp.appointmentid
       JOIN customers c ON c.customerid = a.customerid
       LEFT JOIN users u ON u.userid = c.userid
       LEFT JOIN staff s ON s.staffid = a.staffid
       ORDER BY rp.created_at DESC`
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
      `SELECT aps.serviceid, aps.quantity, aps.price,
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
       SET balance_amount = $1,
           balance_paymongo_id = $2,
           balance_checkout_url = $3,
           balance_status = 'pending',
           total_amount = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE reservationpaymentid = $5
       RETURNING *`,
      [
        data.balance_amount,
        data.balance_paymongo_id,
        data.balance_checkout_url,
        data.total_amount,
        reservationpaymentid,
      ]
    );
    return result.rows[0];
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
        `SELECT * FROM reservationpayment WHERE balance_paymongo_id = $1`,
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
      return payment;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("markBalancePaid error:", err);
      return null;
    } finally {
      client.release();
    }
  }
}
