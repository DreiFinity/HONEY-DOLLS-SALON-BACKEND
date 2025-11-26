import { Router } from "express";
import CustomerPaymentController from "../../../interfaces/controllers/Payment/CustomerPaymentController.js";

export default function CustomerPaymentRoutes(paymentRepository) {
  const router = Router();
  const controller = new CustomerPaymentController(paymentRepository);

  router.post("/", controller.create.bind(controller));

  return router;
}
