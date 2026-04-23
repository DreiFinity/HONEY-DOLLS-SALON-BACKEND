import express from "express";
import SupplierRepositoryImpl from "../../repositories/Supplier/SupplierRepositoryImpl.js";
import GetAllSuppliers from "../../../application/usecases/Supplier/GetAllSuppliers.js";
import CreateSupplier from "../../../application/usecases/Supplier/CreateSupplier.js";
import UpdateSupplier from "../../../application/usecases/Supplier/UpdateSupplier.js";
import DeleteSupplier from "../../../application/usecases/Supplier/DeleteSupplier.js";
import SupplierController from "../../../interfaces/controllers/Supplier/SupplierController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const repo = new SupplierRepositoryImpl();
const getAllSuppliers = new GetAllSuppliers(repo);
const createSupplier = new CreateSupplier(repo);
const updateSupplier = new UpdateSupplier(repo);
const deleteSupplier = new DeleteSupplier(repo);

const controller = new SupplierController(
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
);

router.get("/", auth, controller.getAllHandler);
router.post("/", auth, controller.createHandler);
router.put("/:id", auth, controller.updateHandler);
router.delete("/:id", auth, controller.deleteHandler);

export default router;
