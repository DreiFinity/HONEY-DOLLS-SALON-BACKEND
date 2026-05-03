import axios from "axios";
import { config } from "../../../config/env.js";

export default class CreateReservationPayment {
  constructor(repository) {
    this.repository = repository;
    this.PAYMONGO_SECRET = config.paymongoSecret;
  }

  /**
   * Create a reservation payment (25% of total service cost) via PayMongo GCash
   */
  async execute({ appointmentid, customerid }) {
    if (!appointmentid) throw new Error("Appointment ID is required");

    // 1. Check if payment already exists for this appointment
    const existing = await this.repository.getByAppointmentId(appointmentid);
    if (existing) {
      if (existing.status === "paid") {
        throw new Error("Reservation fee already paid for this appointment");
      }
      if (existing.status === "pending" && existing.checkout_url) {
        // Return the existing pending session instead of creating a new one
        return existing;
      }
    }

    // 2. If no customerid passed, get it from appointment
    if (!customerid) {
      customerid = await this.repository.getCustomerIdByAppointment(appointmentid);
    }
    if (!customerid) throw new Error("Customer not found for this appointment");

    // 3. Get the appointment services to calculate total
    const services = await this.repository.getAppointmentServices(appointmentid);
    if (!services || services.length === 0) {
      throw new Error("No services found for this appointment");
    }

    // 4. Calculate total service amount and 25% reservation fee
    let totalServiceAmount = 0;
    for (const svc of services) {
      totalServiceAmount += Number(svc.price || 0);
    }

    if (totalServiceAmount <= 0) {
      throw new Error("Total service amount must be greater than 0");
    }

    const reservationFee = Math.ceil(totalServiceAmount * 0.25); // 25% rounded up

    // 5. Get customer info for PayMongo billing
    const customer = await this.repository.getCustomerWithEmail(customerid);
    if (!customer) throw new Error("Customer not found");

    // 6. Generate reference code
    const reference_code = "RES-" + Math.floor(100000 + Math.random() * 900000);

    // 7. Create PayMongo checkout session
    const serviceNames = services.map((s) => s.servicename).join(", ");

    const lineItem = {
      name: `Reservation Fee — ${serviceNames}`,
      description: `25% reservation fee for appointment #${appointmentid}`,
      amount: Math.max(Math.round(reservationFee * 100), 2000), // PayMongo minimum is 20 PHP (2000 centavos)
      currency: "PHP",
      quantity: 1,
    };

    const response = await axios.post(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        data: {
          attributes: {
            billing: {
              name: `${customer.firstname} ${customer.lastname}`,
              email: customer.email || "customer@salon.com",
              phone: customer.contact || "09123456789",
            },
            line_items: [lineItem],
            payment_method_types: ["gcash"],
            success_url: `${config.frontendUrl}/myAppointment?payment=success&appointment=${appointmentid}`,
            cancel_url: `${config.frontendUrl}/myAppointment?payment=cancelled&appointment=${appointmentid}`,
          },
        },
      },
      {
        auth: {
          username: this.PAYMONGO_SECRET,
          password: "",
        },
      }
    );

    const checkout_url = response.data.data.attributes.checkout_url;
    const paymongo_id = response.data.data.id;

    // 8. Save to DB
    const payment = await this.repository.createReservationPayment({
      appointmentid,
      customerid,
      reference_code,
      method: "gcash",
      status: "pending",
      currency: "PHP",
      reservation_fee: reservationFee,
      checkout_url,
      paymongo_id,
    });

    return payment;
  }

  /**
   * Confirm payment by checking PayMongo session status
   */
  async confirmPayment(session_id) {
    if (!session_id) throw new Error("Missing session ID");

    const response = await axios.get(
      `https://api.paymongo.com/v1/checkout_sessions/${session_id}`,
      { auth: { username: this.PAYMONGO_SECRET, password: "" } }
    );

    const session = response.data.data;
    if (session.attributes.status !== "paid") {
      throw new Error("Payment not completed.");
    }

    // Extract payment_id
    const payments = session.attributes.payments;
    const paymentId = payments && payments.length > 0 ? payments[0].id : null;

    const payment = await this.repository.markPaidBySessionId(session_id, paymentId);
    return payment;
  }

  /**
   * Refund a reservation payment via PayMongo
   */
  async refundAppointmentPayment(appointmentid) {
    const paymentRecord = await this.repository.getByAppointmentId(appointmentid);
    if (!paymentRecord) {
      console.log(`No payment record found for appointment ${appointmentid}, skipping auto-refund.`);
      return null;
    }

    if (paymentRecord.status !== "paid") {
      console.log(`Payment status for appointment ${appointmentid} is ${paymentRecord.status}, cannot refund.`);
      return null;
    }

    const paymentId = paymentRecord.paymongo_payment_id;
    if (!paymentId) {
      console.log(`No PayMongo payment ID found for appointment ${appointmentid}. Manual refund may be required.`);
      return null;
    }

    try {
      console.log(`Initiating PayMongo refund for Payment ID: ${paymentId}`);
      const refundAmount = Math.round(paymentRecord.reservation_fee * 100);

      const response = await axios.post(
        "https://api.paymongo.com/v1/refunds",
        {
          data: {
            attributes: {
              amount: refundAmount,
              payment_id: paymentId,
              reason: "requested_by_customer",
              notes: `Refund for rejected appointment #${appointmentid}`
            }
          }
        },
        {
          auth: {
            username: this.PAYMONGO_SECRET,
            password: ""
          }
        }
      );

      console.log("PayMongo Refund Response:", response.data);

      // Update DB status to refunded
      await this.repository.markRefundedByAppointmentId(appointmentid);

      return response.data;
    } catch (err) {
      console.error("PayMongo Refund Error:", err.response?.data || err.message);
      // Still mark as refunded in DB or handle error?
      // For now, let's just log it.
      throw new Error("PayMongo Refund failed: " + (err.response?.data?.errors?.[0]?.detail || err.message));
    }
  }

  /**
   * Handle PayMongo webhook for reservation payments
   */
  /**
   * Create a checkout session for the remaining 75% balance
   */
  async createBalanceCheckout(appointmentid) {
    // 1. Get the existing payment record
    const payment = await this.repository.getByAppointmentId(appointmentid);
    if (!payment) throw new Error("Reservation payment record not found");

    // 2. Get services to calculate total
    const services = await this.repository.getAppointmentServices(appointmentid);
    const totalAmount = services.reduce(
      (sum, s) => sum + Number(s.price || 0),
      0
    );

    // 3. Calculate balance (Total - Reservation Fee)
    const balanceAmount = totalAmount - Number(payment.reservation_fee);

    if (balanceAmount <= 0) {
      throw new Error("No balance remaining for this appointment.");
    }

    // 4. Get customer info
    const customerid = await this.repository.getCustomerIdByAppointment(appointmentid);
    const customer = await this.repository.getCustomerWithEmail(customerid);

    // 5. Create PayMongo Checkout Session for the balance
    const serviceNames = services.map((s) => s.servicename).join(", ");

    const lineItem = {
      name: `Service Balance — ${serviceNames}`,
      description: `Remaining balance for appointment #${appointmentid} (Amount: ₱${balanceAmount.toFixed(2)})`,
      amount: Math.round(balanceAmount * 100), // centavos
      currency: "PHP",
      quantity: 1,
    };

    const response = await axios.post(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: [lineItem],
            payment_method_types: ["gcash"],
            success_url: `${config.frontendUrl}/myAppointment?payment=success`,
            cancel_url: `${config.frontendUrl}/myAppointment?payment=cancelled`,
          },
        },
      },
      {
        auth: {
          username: this.PAYMONGO_SECRET,
          password: "",
        },
      }
    );

    const checkout_url = response.data.data.attributes.checkout_url;
    const paymongo_id = response.data.data.id;

    // 6. Update DB with balance info
    const updated = await this.repository.updateBalanceInfo(payment.reservationpaymentid, {
      balance_paymongo_id: paymongo_id,
      balance_checkout_url: checkout_url,
    });

    return updated;
  }

  /**
   * Webhook handler for balance payments
   */
  async handleWebhook(event) {
    console.log("DEBUG: ReservationPayment UseCase handling webhook...");
    if (event?.data?.attributes?.type !== "checkout_session.payment.paid") {
      console.log("DEBUG: Not a checkout_session.payment.paid event");
      return false;
    }

    const session = event.data.attributes.data;
    const sessionId = session.id;
    console.log("DEBUG: Processing PayMongo session ID:", sessionId);

    // Extract payment ID from webhook data if available
    const payments = session.attributes.payments;
    const paymentId = payments && payments.length > 0 ? payments[0].id : null;

    // Check if it's a reservation fee payment
    const reservationHandled = await this.repository.markPaidBySessionId(sessionId, paymentId);
    if (reservationHandled) {
      console.log("DEBUG: Successfully marked Reservation Payment as PAID for session:", sessionId);
      return true;
    }

    // Check if it's a balance payment
    const balanceHandled = await this.repository.markBalancePaid(sessionId);
    if (balanceHandled) {
      console.log("DEBUG: Successfully marked Balance Payment as PAID for session:", sessionId);
      return true;
    }

    console.log("DEBUG: Session ID not found in Reservation Payments, falling through...");
    return false;
  }
}
