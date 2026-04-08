import express from "express";
import SupplierPurchaseRepositoryImpl from "../../repositories/Purchase/SupplierPurchaseRepositoryImpl.js";
import CreateSupplierPurchase from "../../../application/usecases/Purchase/CreateSupplierPurchase.js";
import CreateSupplierPayment from "../../../application/usecases/Purchase/CreateSupplierPayment.js";
import { GetAllSupplierPurchases, GetSupplierPurchaseById } from "../../../application/usecases/Purchase/RetrieveSupplierPurchases.js";
import SupplierPurchaseController from "../../../interfaces/controllers/Purchase/SupplierPurchaseController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const repo = new SupplierPurchaseRepositoryImpl();
const createUseCase = new CreateSupplierPurchase(repo);
const payUseCase = new CreateSupplierPayment(repo);
const listUseCase = new GetAllSupplierPurchases(repo);
const getByIdUseCase = new GetSupplierPurchaseById(repo);

const controller = new SupplierPurchaseController(
  createUseCase,
  listUseCase,
  getByIdUseCase,
  payUseCase
);

// Apply auth middleware to all purchase routes
router.use(auth);

router.post("/", controller.createHandler);
router.post("/:id/payment", controller.addPaymentHandler);
router.get("/records", controller.recordsHandler);
router.put("/records/:id/arrival", controller.arrivalHandler);
router.get("/", controller.listHandler);
router.get("/:id", controller.detailHandler);

export default router;
