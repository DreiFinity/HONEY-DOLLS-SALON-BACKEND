// src/infrastructure/web/routes/paymongoWebhookRoutes.js
import express from "express";
import CreateProductPayment from "../../../application/usecases/Payment/CreateProductPayment.js";
import CustomerProductPaymentRepositoryImpl from "../../repositories/Payment/CustomerProductPaymentRepositoryImpl.js";

const router = express.Router();
const repository = new CustomerProductPaymentRepositoryImpl();
const paymentUseCase = new CreateProductPayment(repository);

router.post("/paymongo-webhook", async (req, res) => {
  try {
    console.log("=== Webhook received ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    const event = req.body;

    await paymentUseCase.handleWebhook(event);

    console.log("Webhook processed successfully");

    // Always respond 200 to PayMongo
    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing error:", err);
    // still respond 200 so PayMongo doesn’t disable webhook
    res.sendStatus(200);
  }
});

export default router;
