import { Router } from "express";
import AppointmentController from "../../../interfaces/controllers/Appointment/AppointmentController.js";
import auth from "../middleware/auth.js";

export default function AppointmentRoutes(appointmentRepository) {
  const router = Router();
  const controller = new AppointmentController(appointmentRepository);

  router.post("/", auth, controller.create.bind(controller)); // Create
  router.put("/:id", auth, controller.update.bind(controller)); // Update / Reschedule
  router.delete("/:id", auth, controller.delete.bind(controller)); // Delete
  router.get("/", auth, controller.get.bind(controller)); // Get / List

  return router;
}
