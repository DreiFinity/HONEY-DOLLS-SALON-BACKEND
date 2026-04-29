// src/infrastructure/web/routes/ProductTransferRoutes.js
import express from "express";
import ProductTransferRepositoryImpl from "../../repositories/Branch/ProductTransferRepositoryImpl.js";
import InventoryRepositoryImpl from "../../repositories/Inventory/InventoryRepositoryImpl.js";
import BranchRepositoryImpl from "../../repositories/Branch/BranchRepositoryImpl.js";
import AdminRepositoryImpl from "../../repositories/Admin/AdminRepositoryImpl.js";
import TransferProductStock from "../../../application/usecases/Branch/TransferProductStock.js";
import GetAllTransfers from "../../../application/usecases/Branch/GetAllTransfers.js";
import GetAllBranches from "../../../application/usecases/Branch/GetAllBranches.js";
import ConfirmTransferArrival from "../../../application/usecases/Branch/ConfirmTransferArrival.js";
import GetIncomingTransfers from "../../../application/usecases/Branch/GetIncomingTransfers.js";
import ProductTransferController from "../../../interfaces/controllers/Branch/ProductTransferController.js";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/isadmin.js";

const router = express.Router();

// Repositories
const transferRepo = new ProductTransferRepositoryImpl();
const inventoryRepo = new InventoryRepositoryImpl();
const branchRepo = new BranchRepositoryImpl();
const adminRepo = new AdminRepositoryImpl();

// Use Cases
const transferUseCase = new TransferProductStock(transferRepo, inventoryRepo, adminRepo);
const getAllTransfersUseCase = new GetAllTransfers(transferRepo);
const getAllBranchesUseCase = new GetAllBranches(branchRepo);
const confirmArrivalUseCase = new ConfirmTransferArrival(transferRepo);
const getIncomingTransfersUseCase = new GetIncomingTransfers(transferRepo);

// Controller
const controller = new ProductTransferController(
  transferUseCase,
  getAllTransfersUseCase,
  getAllBranchesUseCase,
  confirmArrivalUseCase,
  getIncomingTransfersUseCase
);

// Routes
router.use(auth); // Require authentication

// Admin only routes
router.post("/", isAdmin, (req, res) => controller.transferHandler(req, res));
router.get("/", isAdmin, (req, res) => controller.listTransfersHandler(req, res));
router.get("/branches", isAdmin, (req, res) => controller.listBranchesHandler(req, res));

// Staff and Admin routes
router.get("/incoming/:branchid", (req, res) => controller.listIncomingTransfersHandler(req, res));
router.put("/:id/confirm", (req, res) => controller.confirmArrivalHandler(req, res));

export default router;
