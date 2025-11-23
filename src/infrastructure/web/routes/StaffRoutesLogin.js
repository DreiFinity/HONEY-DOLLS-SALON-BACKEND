import express from "express";
import { StaffController } from "../../../interfaces/controllers/Staff/StaffControllerLogin.js";

const router = express.Router();

router.post("/login", StaffController.login);

export default router;
