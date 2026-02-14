// src/infrastructure/web/routes/ProductRoutes.js
import { Router } from "express";
import ProductController from "../../../interfaces/controllers/Product/ProductController.js";

export default function ProductRoutes(productRepository) {
  const router = Router();
  const controller = new ProductController(productRepository);

  router.get("/", controller.getAll.bind(controller));

  return router;
}