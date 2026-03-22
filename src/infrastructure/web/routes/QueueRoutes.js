import express from "express";
import QueueController from "../../../interfaces/controllers/Queue/QueueController.js";
import auth from "../middleware/auth.js";

export default function QueueRoutes(queueRepository) {
  const router = express.Router();
  const controller = new QueueController(queueRepository);

  router.get("/", auth, (req, res) => controller.getAll(req, res));
  router.post("/", auth, (req, res) => controller.create(req, res));
  router.put("/:id", auth, (req, res) => controller.update(req, res));
  router.delete("/:id", auth, (req, res) => controller.delete(req, res));
router.get("/admin", auth, (req, res) =>
  controller.getAdminQueue(req, res)
);
  return router;
}