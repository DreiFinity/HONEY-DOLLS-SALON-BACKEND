import express from "express";
import InventoryController from "../../../interfaces/controllers/Inventory/InventoryController.js";
import InventoryRepositoryImpl from "../../repositories/Inventory/InventoryRepositoryImpl.js";

const router = express.Router();
const inventoryRepository = new InventoryRepositoryImpl();
const inventoryController = new InventoryController(inventoryRepository);

router.get("/branch/:branchid", (req, res) => inventoryController.getByBranch(req, res));
router.get("/all", (req, res) => inventoryController.getAll(req, res));

export default router;
