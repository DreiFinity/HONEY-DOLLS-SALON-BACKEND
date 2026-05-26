import axios from "axios";
import { config } from "../../../config/env.js";
import { sendReceiptEmail } from "../../../interfaces/controllers/Payment/EmailService.js";

export default class CreateProductPayment {
  constructor(repository) {
    this.repository = repository;
    this.customerPaymentRepository = repository;
    this.PAYMONGO_SECRET = config.paymongoSecret || process.env.PAYMONGO_SECRET_KEY;
    console.log("[DEBUG] PayMongo Secret present:", !!this.PAYMONGO_SECRET);
  }

  async execute(body, customerid) {
    const {
      orderids,
      method,
      shipping_street,
      shipping_barangay,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      courier_name,
      estimated_delivery_date,
      delivery_fee,
    } = body;

    if (!orderids || !method) {
      throw new Error("Order IDs and payment method required");
    }

    const orderIdsArray = Array.isArray(orderids) ? orderids : [orderids];

    const orders = await this.repository.getOrdersByIds(orderIdsArray);

    if (orders.length !== orderIdsArray.length)
      throw new Error("Some orders not found");

    if (orders.some((o) => o.customerid !== customerid))
      throw new Error("Unauthorized order detected");

    let itemsTotal = 0;

    for (const order of orders) {
      const items = await this.repository.getOrderItems(order.orderid);

      for (const item of items) {
        itemsTotal += Number(item.unit_price) * Number(item.quantity);
      }
    }

    const deliveryFee = Number(delivery_fee || 0);
    const totalAmount = itemsTotal + deliveryFee;

    let checkout_url = null;
    let reference_code = null;
    let paymongo_id = null;

    // GCASH
    if (method === "gcash") {
      reference_code = "GCASH-" + Math.floor(100000 + Math.random() * 900000);
      const customer = await this.repository.getCustomerWithEmail(customerid);

      const orderIdsString = orderIdsArray.join(", ");

      const lineItem = {
        name: `Orders #${orderIdsString}`,
        amount: Math.round(totalAmount * 100),
        currency: "PHP",
        quantity: 1,
      };

      let response;
      try {
        response = await axios.post(
          "https://api.paymongo.com/v1/checkout_sessions",
          {
            data: {
              attributes: {
                billing: {
                  name: `${customer.firstname || "Guest"} ${customer.lastname || "Customer"}`,
                  email: customer.email || "customer@example.com",
                  phone: customer.contact || "09123456789",
                },
                line_items: [lineItem],
                payment_method_types: ["gcash"],
                success_url: `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "")}/receipt`,
                cancel_url: `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "")}/customerTransaction`,
              },
            },
          },
          {
            headers: {
              Authorization: `Basic ${Buffer.from(this.PAYMONGO_SECRET + ":").toString("base64")}`,
            },
          },
        );
      } catch (err) {
        console.error("❌ PayMongo API Error:", err.response?.data || err.message);
        throw new Error(err.response?.data?.errors?.[0]?.detail || err.message);
      }

      checkout_url = response.data.data.attributes.checkout_url;
      paymongo_id = response.data.data.id;
    }

    // COD
    if (method === "cod") {
      reference_code = "COD-" + Math.floor(100000 + Math.random() * 900000);
    }

    return await this.repository.createPaymentWithOrders({
      customerid,
      orderIdsArray,
      reference_code,
      paymongo_id,
      method,
      checkout_url,
      status: "pending",
      currency: "PHP",
      shipping_street,
      shipping_barangay,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      courier_name,
      estimated_delivery_date,
      delivery_fee: deliveryFee,
    });
  }

  async confirmPaymongoPayment(session_id, customerid) {
    if (!session_id) throw new Error("Missing session ID");

    // Call PayMongo API to confirm status
    const response = await axios.get(
      `https://api.paymongo.com/v1/checkout_sessions/${session_id}`,
      { headers: { Authorization: `Basic ${Buffer.from(this.PAYMONGO_SECRET + ":").toString("base64")}` } },
    );

    const session = response.data.data;
    if (session.attributes.status !== "paid") {
      throw new Error("Payment not completed.");
    }

    // Update payment + orders in DB
    const payment =
      await this.repository.markPaymentAndOrdersPaidBySession(session_id);

    return payment;
  }
  // CreateProductPayment.js
  async createCheckoutSession(data) {
    const response = await axios.post(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        data: {
          attributes: {
            line_items: data.lineItems,
            payment_method_types: ["gcash"],
            success_url: `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "")}/payment/payment-success`,
            cancel_url: `${(process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "")}/payment/payment-cancel`,
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`,
        },
      },
    );

    const session = response.data.data;

    // store pending payment
    await this.repository.createCustomerPayment({
      paymongo_id: session.id,
      customerid: data.customerid,
      status: "pending",
    });

    return session.attributes.checkout_url;
  }
  async handleWebhook(event) {
    try {
      // Only process payment succeeded events
      if (event?.data?.attributes?.type !== "checkout_session.payment.paid")
        return;

      const sessionId = event.data.attributes.data.id;
      console.log("Processing PayMongo webhook for session:", sessionId);

      // 1. Mark payment and orders as paid
      const payment =
        await this.repository.markPaymentAndOrdersPaidBySession(sessionId);
      if (!payment) {
        console.log("Payment not found in DB for session:", sessionId);
        return;
      }

      // 2. Get customer email
      const customer = await this.repository.getCustomerWithEmail(
        payment.customerid,
      );

      // 3. Fetch all products/orders linked to this payment
      const orderItems = await this.repository.getOrderBySessionId(sessionId);

      // 4. Attach orders to payment object
      payment.orders = orderItems;

      // 5. Send receipt email
      await sendReceiptEmail(payment, customer.email);

      console.log("✅ Receipt email sent for session:", sessionId);
    } catch (err) {
      console.error("❌ Webhook processing error:", err);
    }
  }
}
