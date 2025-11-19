import { Router } from "express";

import { RegisterController } from "../controllers/RegisterController.js";

export default function RegisterRoutes() {
  const router = Router();

  const registerController = new RegisterController(userRepository);

  router.post("/register", registerController.register);

  return router;
}
