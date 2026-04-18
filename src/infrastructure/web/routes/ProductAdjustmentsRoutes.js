// src/infrastructure/web/routes/ProductAdjustmentsRoutes.js
import { Router } from "express";
import ProductAdjustmentsController from "../../../interfaces/controllers/ProductAdjustments/ProductAdjustmentsController.js";

export default function ProductAdjustmentsRoutes(productAdjustmentsRepository) {
  const router = Router();
  const controller = new ProductAdjustmentsController(productAdjustmentsRepository);

  // GET all adjustments (waste + usage + damage combined)
  router.get("/", controller.getAll.bind(controller));

  // Waste
  router.post("/waste", controller.createWaste.bind(controller));
  router.delete("/waste/:id", controller.deleteWaste.bind(controller));

  // Usage
  router.post("/usage", controller.createUsage.bind(controller));
  router.delete("/usage/:id", controller.deleteUsage.bind(controller));

  // Damage
  router.post("/damage", controller.createDamage.bind(controller));
  router.delete("/damage/:id", controller.deleteDamage.bind(controller));

  return router;
}
