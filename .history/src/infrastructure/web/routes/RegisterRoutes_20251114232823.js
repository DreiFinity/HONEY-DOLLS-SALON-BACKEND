// src/infrastructure/web/routes/RegisterRoutes.js
import { Router } from "express";
import { RegisterController } from "../../../interfaces/controllers/Register/RegisterController.js";

export default function RegisterRoutes(userRepository) {
  const router = Router();
  const registerController = new RegisterController(userRepository);

  router.post(
    "/register",
    registerController.register.bind(registerController)
  );
  return router;
}
