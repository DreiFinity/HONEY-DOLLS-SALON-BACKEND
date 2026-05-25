import express from "express";
import auth from "../middleware/auth.js";
import SettingsRepositoryImpl from "../../repositories/Settings/SettingsRepositoryImpl.js";
import SettingsController from "../../../interfaces/controllers/Settings/SettingsController.js";

const router = express.Router();
const repo = new SettingsRepositoryImpl();
const controller = new SettingsController(repo);

// Allow authenticated users to view settings
router.get("/", auth, controller.getAll.bind(controller));

// Only allow admins to update settings
router.put("/", auth, (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Forbidden: Admins only" });
  }
}, controller.update.bind(controller));

export default router;
