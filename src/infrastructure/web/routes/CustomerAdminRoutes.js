import express from "express";
import CustomerRepositoryImpl from "../../repositories/Customer/CustomerRepositoryImpl.js";
import GetAllCustomers from "../../../application/usecases/Customer/GetAllCustomers.js";
import CustomerAdminController from "../../../interfaces/controllers/Customer/CustomerAdminController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const repo = new CustomerRepositoryImpl();
const getAllCustomers = new GetAllCustomers(repo);
const controller = new CustomerAdminController(getAllCustomers);

router.get("/", auth, controller.getAllCustomersHandler);

export default router;
