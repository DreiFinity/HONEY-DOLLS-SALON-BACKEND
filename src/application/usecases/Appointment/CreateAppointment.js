import axios from "axios";
import { config } from "../../../config/env.js";
import { pool } from "../../../infrastructure/db/index.js";

export default class CreateAppointment {
  constructor(appointmentRepository, reservationPaymentRepository) {
    this.appointmentRepository = appointmentRepository;
    this.reservationPaymentRepository = reservationPaymentRepository;
    this.PAYMONGO_SECRET = config.paymongoSecret;
  }

  async execute({
    userId,
    services,
    starttime,
    endtime,
    staffid,
    notes,
    priority,
    status = "pending",
    branchid,
  }) {
    console.log("DEBUG Unified CreateAppointment started for user:", userId);

    // 1. Pre-validation and Data Prep
    const customerId = await this.appointmentRepository.findCustomerIdByUserId(userId);
    if (!customerId) throw new Error("Customer profile not found");

    const customer = await this.reservationPaymentRepository.getCustomerWithEmail(customerId);

    // Fetch full service details to get prices
    const serviceIds = services.map(s => s.serviceid);
    const serviceDetails = await this.reservationPaymentRepository.getServicesByIds(serviceIds);
    
    if (!serviceDetails || serviceDetails.length === 0) {
      throw new Error("Invalid services selected");
    }

    let totalServiceAmount = 0;
    for (const svc of serviceDetails) {
      totalServiceAmount += Number(svc.amount || 0);
    }
    if (totalServiceAmount <= 0) throw new Error("Total service amount must be > 0");

    let pct = 25;
    try {
      const settingsRes = await pool.query("SELECT value FROM settings WHERE key = 'downpayment_percentage'");
      if (settingsRes.rows.length > 0) {
        pct = parseFloat(settingsRes.rows[0].value);
      }
    } catch (err) {
      console.error("Error fetching downpayment_percentage setting:", err);
    }

    const reservationFee = Math.ceil(totalServiceAmount * (pct / 100));
    const reference_code = "RES-" + Math.floor(100000 + Math.random() * 900000);

    // 2. Create Appointment in Database FIRST
    let appointment;
    try {
      appointment = await this.appointmentRepository.createAppointment({
        customerid: customerId,
        starttime,
        endtime,
        staffid,
        notes,
        priority,
        status,
        services,
        branchid,
      });
    } catch (dbErr) {
      console.error("Database Error creating appointment:", dbErr.message);
      throw new Error("Critical error saving appointment. Please contact support.");
    }

    // 3. Create PayMongo Session (External API)
    const serviceNames = services.map((s) => s.servicename || "Service").join(", ");
    const lineItem = {
      name: `Reservation Fee — ${serviceNames}`,
      description: `${pct}% reservation fee for appointment`,
      amount: Math.max(Math.round(reservationFee * 100), 2000),
      currency: "PHP",
      quantity: 1,
    };

    let checkout_url, paymongo_id;
    try {
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
              success_url: `${config.frontendUrl}/myAppointment?payment=success&appointment=${appointment.appointmentid}`,
              cancel_url: `${config.frontendUrl}/myAppointment?payment=cancelled&appointment=${appointment.appointmentid}`,
            },
          },
        },
        {
          auth: { username: this.PAYMONGO_SECRET, password: "" },
        }
      );
      checkout_url = response.data.data.attributes.checkout_url;
      paymongo_id = response.data.data.id;
    } catch (err) {
      console.error("PayMongo Error:", err.response?.data || err.message);
      // Even if PayMongo fails, the appointment is created (status pending). 
      // They can pay later via "Pay Deposit" button.
      throw new Error("Failed to initiate payment session with PayMongo, but appointment was saved.");
    }

    // 4. Create Payment record linked to the new appointment
    let payment;
    try {
      payment = await this.reservationPaymentRepository.createReservationPayment({
        appointmentid: appointment.appointmentid,
        customerid: customerId,
        reference_code,
        method: "gcash",
        status: "pending",
        currency: "PHP",
        reservation_fee: reservationFee,
        checkout_url,
        paymongo_id,
      });
    } catch (dbErr) {
      console.error("Database Error saving payment record:", dbErr.message);
      // Again, appointment is already created.
    }

      return {
        appointment,
        payment,
        checkout_url,
      };
  }
}
