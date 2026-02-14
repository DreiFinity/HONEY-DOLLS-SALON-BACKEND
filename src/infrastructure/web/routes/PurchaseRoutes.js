import { Router } from "express";
import PurchaseController from "../../../interfaces/controllers/Purchase/PurchaseOrderController.js";

export default function PurchaseRoutes(purchaseRepository) {
  const router = Router();
  const controller = new PurchaseController(purchaseRepository);

  router.post("/", controller.create.bind(controller));
  router.get("/", controller.getAll.bind(controller));

  return router;
}
