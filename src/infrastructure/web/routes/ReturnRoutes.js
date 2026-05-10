import express from "express";
import ReturnRepositoryImpl from "../../repositories/Return/ReturnRepositoryImpl.js";
import RequestReturn from "../../../application/usecases/Return/RequestReturn.js";
import GetCustomerReturns from "../../../application/usecases/Return/GetCustomerReturns.js";
import ProductReturnController from "../../../interfaces/controllers/Return/ProductReturnController.js";
import auth from "../middleware/auth.js";
import { upload, handleCloudinaryUrl } from "../middleware/upload.js";

const router = express.Router();

const repository = new ReturnRepositoryImpl();
const requestUseCase = new RequestReturn(repository);
const getUseCase = new GetCustomerReturns(repository);
const controller = new ProductReturnController(requestUseCase, getUseCase);

router.post("/", auth, upload.array("evidence", 5), handleCloudinaryUrl, (req, res) => controller.requestReturn(req, res));
router.get("/my-returns", auth, (req, res) => controller.getMyReturns(req, res));
router.get("/customer/:customerid", auth, (req, res) => controller.getByCustomer(req, res));
router.get("/all", auth, (req, res) => controller.getAll(req, res));
router.put("/:returnid/status", auth, (req, res) => controller.updateStatus(req, res));
router.put("/:returnid/refund", auth, upload.single("receipt"), handleCloudinaryUrl, (req, res) => controller.processReturnRefund(req, res));

export default router;
