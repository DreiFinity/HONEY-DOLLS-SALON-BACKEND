import express from "express";
import CreateProductPayment from "../../../application/usecases/Payment/CreateProductPayment.js";
import CustomerProductPaymentRepositoryImpl from "../../repositories/Payment/CustomerProductPaymentRepositoryImpl.js";
import SupplierPurchaseRepositoryImpl from "../../repositories/Purchase/SupplierPurchaseRepositoryImpl.js";
import CreateSupplierPayment from "../../../application/usecases/Purchase/CreateSupplierPayment.js";

const router = express.Router();
const productRepo = new CustomerProductPaymentRepositoryImpl();
const supplierRepo = new SupplierPurchaseRepositoryImpl();

const productPaymentUseCase = new CreateProductPayment(productRepo);
const supplierPaymentUseCase = new CreateSupplierPayment(supplierRepo);

router.post("/paymongo-webhook", async (req, res) => {
  try {
    console.log("=== PayMongo Webhook Received ===");
    const event = req.body;

    // 1. Try handling as a Supplier Purchase Payment
    const supplierHandled = await supplierPaymentUseCase.handleWebhook(event);

    // 2. If not a supplier payment, try as a Customer Product Payment
    if (!supplierHandled) {
      await productPaymentUseCase.handleWebhook(event);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.sendStatus(200); // Always 200 for PayMongo
  }
});

export default router;
