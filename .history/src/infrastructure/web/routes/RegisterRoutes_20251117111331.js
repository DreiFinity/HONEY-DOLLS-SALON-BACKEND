import { Router } from "express";
import { RegisterController } from "../../../interfaces/controllers/Register/RegisterController.js";

export default function RegisterRoutes(userRepository) {
  const router = Router();
  const controller = new RegisterController(userRepository);

  router.post("/register", controller.register.bind(controller));

  return router;
}
