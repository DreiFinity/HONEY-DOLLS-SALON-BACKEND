import { Router } from "express";
import { userRepository } from "../../../repositories/UserRepository.js";
import { RegisterController } from "../../../interfaces/controllers/Register/RegisterController.js";

export default function RegisterRoutes() {
  const router = Router();

  const registerController = new RegisterController(userRepository);

  router.post("/register", registerController.register);

  return router;
}
