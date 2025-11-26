import { Router } from "express";
import multer from "multer";
import path from "path";
import ProductController from "../../../interfaces/controllers/Product/ProductController.js";

export default function ProductRoutes(productRepository) {
  const router = Router();
  const controller = new ProductController(productRepository);

  // Multer Storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  const upload = multer({ storage });

  // GET
  router.get("/", controller.getAll.bind(controller));

  // POST (Create product)
  router.post(
    "/",
    upload.single("prodimage"),
    controller.create.bind(controller)
  );

  return router;
}
