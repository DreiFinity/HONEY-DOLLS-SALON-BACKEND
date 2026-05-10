// src/infrastructure/web/routes/ServiceRoutes.js
import express from "express";
import ServiceController from "../../../interfaces/controllers/Service/ServiceController.js";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isadmin.js";
import { upload, handleCloudinaryUrl } from "../middleware/upload.js";
export default function ServiceRoutes(serviceRepository) {
  const router = express.Router();
  const serviceController = new ServiceController(serviceRepository);

  router.get("/", (req, res) => serviceController.getAll(req, res));
  router.get("/:id", (req, res) => serviceController.getById(req, res));
 router.post(
  "/",
  auth,
  isAdmin,
  upload.single("image"), // multer middleware
  handleCloudinaryUrl,
  (req, res) => {
    // multer will put the filename in req.file
    if (req.file) {
      req.body.image = req.file.filename; // store filename in body
    }
    serviceController.create(req, res);
  }
);

router.put(
  "/:id",
  auth,
  isAdmin,
  upload.single("image"),
  handleCloudinaryUrl,
  (req, res) => {
    if (req.file) {
      req.body.image = req.file.filename;
    }
    serviceController.update(req, res);
  }
);
  router.delete("/:id", auth, isAdmin, (req, res) => serviceController.delete(req, res));

  return router;
}