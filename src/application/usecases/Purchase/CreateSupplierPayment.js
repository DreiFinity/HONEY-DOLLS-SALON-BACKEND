import axios from "axios";
import { config } from "../../../config/env.js";

export default class CreateSupplierPayment {
  constructor(supplierPurchaseRepo) {
    this.supplierPurchaseRepo = supplierPurchaseRepo;
    this.PAYMONGO_SECRET = config.paymongoSecret;
    this.FRONTEND_URL = config.frontendUrl || "http://localhost:5173";
  }

  async createCheckout(purchaseid, amount, method, isDownpayment = false, payment_type = 'IMMEDIATE', payment_term_days = 0) {
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
              name: `PO-Payment-${purchase.purchaseid}`,
              quantity: 1,
            },
          ],
          payment_method_types: method === "GCASH" ? ["gcash"] : ["card"],
          success_url: `${this.FRONTEND_URL}/supplierPurRecord`,
          cancel_url: `${this.FRONTEND_URL}/supplierPurchases`,
          description: `Supplier payment for Purchase: #${purchase.purchaseid}`,
          metadata: {
            purchaseid: purchaseid.toString(),
            amount: amount.toString(),
            method: method,
            payment_type: payment_type,
            payment_term_days: payment_term_days.toString(),
            isDownpayment: isDownpayment.toString()
          }
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

      // We NO LONGER record the payment here. 
      // It will only be recorded when the payment is successful (via webhook/confirm).

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
      // Check if already recorded
      const metadata = session.attributes.metadata;
      if (metadata && metadata.purchaseid) {
        const paymentData = {
          purchaseid: parseInt(metadata.purchaseid),
          amount: parseFloat(metadata.amount),
          method: metadata.method,
          paymongo_id: session_id,
          checkout_url: session.attributes.checkout_url,
          status: 'PAID',
          payment_type: metadata.payment_type,
          payment_term_days: parseInt(metadata.payment_term_days)
        };

        // recordPayment should handle "already exists" or I can just let it run (pool query might need ON CONFLICT if I want to be safe)
        // But since we are recording it for the first time only on success now, it should be fine.
        await this.supplierPurchaseRepo.recordPayment(paymentData);
        await this.supplierPurchaseRepo.updateStatus(paymentData.purchaseid, 'COMPLETED');
      }
      return true;
    }
    return false;
  }

  async handleWebhook(event) {
    try {
      // 1. Only process payment succeeded events
      if (event?.data?.attributes?.type !== "checkout_session.payment.paid") return;

      const sessionObj = event.data.attributes.data;
      const sessionId = sessionObj.id;
      const metadata = sessionObj.attributes.metadata;

      console.log("Processing Supplier PayMongo webhook for session:", sessionId, "Metadata:", metadata);

      if (!metadata || !metadata.purchaseid) {
        console.error("No metadata found in PayMongo session");
        return false;
      }

      // Record the payment as PAID now
      const paymentData = {
        purchaseid: parseInt(metadata.purchaseid),
        amount: parseFloat(metadata.amount),
        method: metadata.method,
        paymongo_id: sessionId,
        checkout_url: sessionObj.attributes.checkout_url,
        status: 'PAID',
        payment_type: metadata.payment_type,
        payment_term_days: parseInt(metadata.payment_term_days)
      };

      const result = await this.supplierPurchaseRepo.recordPayment(paymentData);

      if (result) {
        // Also update the purchase order status to COMPLETED (or similar)
        await this.supplierPurchaseRepo.updateStatus(paymentData.purchaseid, 'COMPLETED');
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
