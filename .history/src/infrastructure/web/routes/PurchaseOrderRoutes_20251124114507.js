import { Router } from "express";
import PurchaseOrderController from "../../../interfaces/controllers/Purchase/PurchaseOrderController.js";
import CreatePurchaseOrder from "../../../application/usecases/Purchase/CreatePurchaseOrder.js";

export default function PurchaseOrderRoutes(repository) {
  const router = Router();

  const createPurchaseOrderUseCase = new CreatePurchaseOrder(repository);
  const controller = new PurchaseOrderController(createPurchaseOrderUseCase);

  router.post("/", controller.create.bind(controller));

  return router;
}
