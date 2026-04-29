import axios from "axios";
import { config } from "../../../config/env.js";

export default class CreateSupplierPayment {
  constructor(supplierPurchaseRepo) {
    this.supplierPurchaseRepo = supplierPurchaseRepo;
    this.PAYMONGO_SECRET = config.paymongoSecret;
    this.FRONTEND_URL = config.frontendUrl || "http://localhost:5173";
  }

  async createCheckout(purchaseid, amount, method, isDownpayment = false) {
    // 1. Validate purchase exists
    const purchase = await this.supplierPurchaseRepo.findById(purchaseid);
    if (!purchase) throw new Error("Purchase Order not found");

    // 2. Create Checkout Session on PayMongo
    const data = {
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              amount: Math.round(amount * 100), // convert to cents
              currency: "PHP",
              description: `Payment for Purchase #${purchaseid}`,
              name: `PO-Payment-${purchase.reference_code || purchaseid}`,
              quantity: 1,
            },
          ],
          payment_method_types: method === "GCASH" ? ["gcash"] : ["card"],
          success_url: `${this.FRONTEND_URL}/supplierPurRecord`,
          cancel_url: `${this.FRONTEND_URL}/supplierPurchases`,
          description: `Supplier payment for Reference: ${purchase.reference_code || purchaseid}`,
        },
      },
    };

    try {
      console.log("PayMongo Data:", JSON.stringify(data, null, 2));
      const response = await axios.post(
        "https://api.paymongo.com/v1/checkout_sessions",
        data,
        {
          auth: {
            username: this.PAYMONGO_SECRET,
            password: "",
          },
        }
      );

      const session = response.data.data;

      // 3. Record PENDING payment in DB
      // If it's NOT a downpayment, we record 0 as per user instruction (means full payment)
      const dbAmount = isDownpayment ? amount : 0;

      await this.supplierPurchaseRepo.recordPayment({
        purchaseid,
        amount: dbAmount,
        method: method,
        paymongo_id: session.id,
        checkout_url: session.attributes.checkout_url,
        status: 'PENDING'
      });

      return {
        checkout_url: session.attributes.checkout_url,
        paymongo_id: session.id
      };
    } catch (err) {
      console.error("PayMongo Error:", err.response?.data || err.message);
      throw new Error(`Payment processing failed: ${err.response?.data?.errors?.[0]?.detail || err.message}`);
    }
  }

  async confirmPayment(session_id) {
    const response = await axios.get(
      `https://api.paymongo.com/v1/checkout_sessions/${session_id}`,
      {
        auth: {
          username: this.PAYMONGO_SECRET,
          password: "",
        },
      }
    );

    const session = response.data.data;
    if (session.attributes.payment_intent.attributes.status === 'succeeded') {
      // Update local DB
      await this.supplierPurchaseRepo.updatePaymentStatus(session_id, 'PAID');
      return true;
    }
    return false;
  }

  async handleWebhook(event) {
    try {
      // 1. Only process payment succeeded events
      if (event?.data?.attributes?.type !== "checkout_session.payment.paid") return;

      const sessionId = event.data.attributes.data.id;
      console.log("Processing Supplier PayMongo webhook for session:", sessionId);

      // 2. Mark payment and purchase order as paid/completed in DB
      const result = await this.supplierPurchaseRepo.markPaymentPaidBySession(sessionId);

      if (result) {
        console.log("✅ Supplier Payment and PO confirmed for session:", sessionId);
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Supplier Webhook processing error:", err);
      throw err;
    }
  }
}
