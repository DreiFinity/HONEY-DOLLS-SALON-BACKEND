import express from "express";
import SalesRepositoryImpl from "../../repositories/Sales/SalesRepositoryImpl.js";
import SalesController from "../../../interfaces/controllers/Sales/SalesController.js";
import auth from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();
const repository = new SalesRepositoryImpl();
const controller = new SalesController(repository);

// Secure routes
router.use(auth);
router.use(roleCheck("admin"));

router.get("/stats", controller.getStats.bind(controller));
router.get("/dashboard/summary", controller.getDashboardSummary.bind(controller));

export default router;
