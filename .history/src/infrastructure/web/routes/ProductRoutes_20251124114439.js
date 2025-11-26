import { Router } from "express";
import ProductController from "../../../interfaces/controllers/Product/ProductController.js";
import { upload } from "../middleware/upload.js";

export default function ProductRoutes(productRepository) {
  const router = Router();
  const controller = new ProductController(productRepository);

  router.get("/", controller.getAll.bind(controller));

  router.post(
    "/",
    upload.single("prodimage"),
    controller.create.bind(controller)
  );

  return router;
}
