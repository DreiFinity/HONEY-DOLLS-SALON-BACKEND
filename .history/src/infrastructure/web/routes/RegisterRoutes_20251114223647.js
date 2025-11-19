import { Router } from "express";
import React from "react";
import { RegisterController } from "../controllers/RegisterController.js";

export default function RegisterRoutes() {
  const router = Router();

  const registerController = new RegisterController(userRepository);

  router.post("/register", registerController.register);

  return router;
}
