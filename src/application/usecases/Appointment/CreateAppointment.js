import axios from "axios";
import { config } from "../../../config/env.js";

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

    const reservationFee = Math.ceil(totalServiceAmount * 0.25);
    const reference_code = "RES-" + Math.floor(100000 + Math.random() * 900000);

    // 2. Create PayMongo Session FIRST (External API)
    // We do this before the DB transaction so we don't hold a DB lock during a slow API call
    const serviceNames = services.map((s) => s.servicename || "Service").join(", ");
    const lineItem = {
      name: `Reservation Fee — ${serviceNames}`,
      description: `25% reservation fee for appointment`,
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
              success_url: `${config.frontendUrl}/custapp?payment=success`,
              cancel_url: `${config.frontendUrl}/custapp?payment=cancelled`,
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
      throw new Error("Failed to initiate payment session with PayMongo.");
    }

    // 3. Save both to Database (The "At the Same Time" part)
    // We will use the existing repository methods which handle their own internal transactions
    try {
      // Create Appointment
      const appointment = await this.appointmentRepository.createAppointment({
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

      // Create Payment record linked to the new appointment
      const payment = await this.reservationPaymentRepository.createReservationPayment({
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

      return {
        appointment,
        payment,
        checkout_url,
      };
    } catch (dbErr) {
      console.error("Database Error in Unified Flow:", dbErr.message);
      throw new Error("Critical error saving appointment. Please contact support.");
    }
  }
}
