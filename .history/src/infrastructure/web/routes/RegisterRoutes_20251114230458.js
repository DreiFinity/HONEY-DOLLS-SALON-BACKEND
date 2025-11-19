// src/infrastructure/web/routes/RegisterRoutes.js
import { Router } from "express";
import { RegisterController } from "../../../interfaces/controllers/Register/RegisterController.js";
import { userRepository } from "../../../domain/repositories/Login/UserRepository.js";

const router = Router();

const registerController = new RegisterController(userRepository);

router.post("/register", registerController.register.bind(registerController));

export default router;
