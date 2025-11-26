import { Router } from "express";
import CreatePurchaseOrder from "../../../application/usecases/Purchase/CreatePurchaseOrder.js";
import PurchaseOrderController from "../../../interfaces/controllers/PurchaseOrderController.js";

export default function PurchaseOrderRoutes(repository) {
  const router = Router();

  const createPurchaseOrderUseCase = new CreatePurchaseOrder(repository);
  const controller = new PurchaseOrderController(createPurchaseOrderUseCase);

  router.post("/", controller.create.bind(controller));

  return router;
}
