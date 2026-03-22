import express from "express";
import CustomerPaymentOrderRepositoryImpl from "../../repositories/Payment/CustomerPaymentOrderRepositoryImpl.js";
import GetCustomerPaymentOrders from "../../../application/usecases/Payment/GetCustomerPaymentOrders.js";
import CustomerPaymentOrderController from "../../../interfaces/controllers/Payment/CustomerPaymentOrderController.js";
import auth from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();

// Wire up: Repository → UseCase → Controller
const repository = new CustomerPaymentOrderRepositoryImpl();
const useCase = new GetCustomerPaymentOrders(repository);
const controller = new CustomerPaymentOrderController(useCase);

// ── All routes require admin login ───────────────────────────────
router.use(auth);
router.use(roleCheck("admin"));

// Get ALL payment orders
router.get("/", controller.getAll.bind(controller));

// Get payment orders filtered by status (pending, paid, etc.)
router.get("/status/:status", controller.getByStatus.bind(controller));

// Get all payment orders for a specific customer
router.get(
  "/customer/:customerid",
  controller.getByCustomerId.bind(controller),
);

// Get a single payment order by ID (full details)
router.get("/:id", controller.getById.bind(controller));

// ── Update tracking number → sets shipped_at + status="shipping" ─
router.put(
  "/:id/tracking",
  controller.updateTracking.bind(controller),
);

// ── Mark order as delivered → sets delivered_at + status="delivered" ─
router.put(
  "/:id/delivered",
  controller.markDelivered.bind(controller),
);

export default router;
