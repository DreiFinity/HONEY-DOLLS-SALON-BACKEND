// src/infrastructure/web/routes/ProductTransferRoutes.js
import express from "express";
import ProductTransferRepositoryImpl from "../../repositories/Branch/ProductTransferRepositoryImpl.js";
import InventoryRepositoryImpl from "../../repositories/Inventory/InventoryRepositoryImpl.js";
import BranchRepositoryImpl from "../../repositories/Branch/BranchRepositoryImpl.js";
import AdminRepositoryImpl from "../../repositories/Admin/AdminRepositoryImpl.js";
import TransferProductStock from "../../../application/usecases/Branch/TransferProductStock.js";
import GetAllTransfers from "../../../application/usecases/Branch/GetAllTransfers.js";
import GetAllBranches from "../../../application/usecases/Branch/GetAllBranches.js";
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

// Controller
const controller = new ProductTransferController(
  transferUseCase,
  getAllTransfersUseCase,
  getAllBranchesUseCase
);

// Routes
router.use(auth); // Require authentication
router.use(isAdmin); // Require admin role

router.post("/", (req, res) => controller.transferHandler(req, res));
router.get("/", (req, res) => controller.listTransfersHandler(req, res));
router.get("/branches", (req, res) => controller.listBranchesHandler(req, res));

export default router;
