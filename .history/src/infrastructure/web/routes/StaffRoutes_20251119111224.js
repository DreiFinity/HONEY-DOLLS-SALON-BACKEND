// src/infrastructure/web/routes/StaffRoutes.js
import { Router } from "express";
import { StaffController } from "../../../interfaces/controllers/Staff/StaffController.js";

export default function StaffRoutes(staffRepository) {
  const router = Router();
  const controller = new StaffController(staffRepository);

  router.get("/", controller.getAll.bind(controller));

  return router;
}
