// src/infrastructure/web/routes/ProductRoutes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import ProductController from "../../../interfaces/controllers/Product/ProductController.js";

export default function ProductRoutes(productRepository) {
  const router = Router();
  const controller = new ProductController(productRepository);

  // Multer configuration for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"), // Make sure uploads/ folder exists
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage });

  // GET all products
  router.get("/", controller.getAll.bind(controller));

  // POST new product with image
  router.post(
    "/createproduct",
    upload.single("prodimage"), // field name in form-data
    controller.create.bind(controller)
  );

  return router;
}
