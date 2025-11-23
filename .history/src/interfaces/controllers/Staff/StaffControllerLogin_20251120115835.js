import express from "express";
import { StaffController } from "../../../interfaces/controllers/StaffLogin/StaffController.js";

const router = express.Router();

router.post("/login", StaffController.login);

export default router;
