import express from "express";
import AnnouncementController from "../../../interfaces/controllers/Admin/AnnouncementController.js";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isadmin.js";

export default function AnnouncementRoutes(announcementRepository) {
  const router = express.Router();
  const controller = new AnnouncementController(announcementRepository);

  router.get("/", (req, res) => controller.getAll(req, res));
  router.get("/active", (req, res) => controller.getActive(req, res));
  router.get("/:id", (req, res) => controller.getById(req, res));
  router.post("/", auth, isAdmin, (req, res) => controller.create(req, res));
  router.put("/:id", auth, isAdmin, (req, res) => controller.update(req, res));
  router.delete("/:id", auth, isAdmin, (req, res) => controller.delete(req, res));

  return router;
}
