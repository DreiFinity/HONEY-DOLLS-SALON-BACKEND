import express from "express";
import auth from "../../../infrastructure/web/middleware/auth.js";
import getMyProfile from "../../../interfaces/controllers/FetchUser/UserController.js";

const router = express.Router();

router.get("/me", auth, getMyProfile);

export default router;
