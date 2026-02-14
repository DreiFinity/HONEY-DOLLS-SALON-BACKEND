import { Router } from "express";
import ProductController from "../../../controllers/Product/ProductController.js";
import { upload } from "../middleware/upload.js";

export default function ProductRoutes(productRepository) {
  const router = Router();
  const controller = new ProductController(productRepository);

  // GET all products
  router.get("/", controller.getAll.bind(controller));

  // POST create product with image
  router.post(
    "/",
    upload.single("prodimage"),
    controller.create.bind(controller)
  );
  router.put(
    "/:id",
    upload.single("prodimage"),
    controller.update.bind(controller)
  );
  router.delete("/:id", controller.delete.bind(controller));

  return router;
}
