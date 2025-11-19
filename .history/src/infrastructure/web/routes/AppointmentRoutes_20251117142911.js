// src/infrastructure/web/routes/AppointmentRoutes.js
import { Router } from "express";
import { AppointmentController } from "../../../interfaces/controllers/Appointment/AppointmentController.js";
import { auth } from "../middleware/auth.js";

export default function AppointmentRoutes(appointmentRepository) {
  const router = Router();
  const controller = new AppointmentController(appointmentRepository);

  router.post("/", auth, controller.create.bind(controller));

  return router;
}
