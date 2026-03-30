// src/infrastructure/web/routes/StaffRoutes.js
import { Router } from "express";
import StaffController from "../../../interfaces/controllers/Staff/StaffController.js";
import { UserRepositoryImpl } from "../../repositories/Login/UserRepositoryImpl.js";

export default function StaffRoutes(staffRepository) {
  const router = Router();
  const userRepository = new UserRepositoryImpl();
  const controller = new StaffController(staffRepository, userRepository);

  router.get("/", controller.getAll.bind(controller));
  router.post("/", controller.create.bind(controller));
  router.delete("/:id", controller.delete.bind(controller));
  router.put("/:id", controller.update.bind(controller));

  return router;
}
