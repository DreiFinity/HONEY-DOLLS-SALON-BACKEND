// src/infrastructure/web/routes/ServiceRoutes.js
import { Router } from "express";
import ServiceController from "../../../interfaces/controllers/Service/ServiceController.js";

export default function ServiceRoutes(serviceRepository) {
  const router = Router();
  const controller = new ServiceController(serviceRepository);

  router.get("/", controller.getAll.bind(controller));

  return router;
}
