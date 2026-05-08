import express from "express";
import SettlementController from "../../../interfaces/controllers/Payment/SettlementController.js";
import SettlementRepositoryImpl from "../../repositories/Payment/SettlementRepositoryImpl.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const settlementRepository = new SettlementRepositoryImpl();
const settlementController = new SettlementController(settlementRepository);

// POST /api/settlements
router.get("/", auth, (req, res) => settlementController.getAll(req, res));
router.post("/", auth, (req, res) => settlementController.create(req, res));

// GET /api/settlements/:id
router.get("/:id", auth, (req, res) => settlementController.getById(req, res));

// PUT /api/settlements/:id/pay
router.put("/:id/pay", auth, (req, res) => settlementController.markAsPaid(req, res));

// POST /api/settlements/confirm
router.post("/confirm", auth, (req, res) => settlementController.confirm(req, res));

export default router;
