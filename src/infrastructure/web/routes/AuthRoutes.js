// src/infrastructure/web/routes/AuthRoutes.js
import express from "express";
import { UserRepositoryImpl } from "../../repositories/Login/UserRepositoryImpl.js";
import RegisterCustomer from "../../../application/usecases/Register/RegisterCustomer.js";
import RegisterStaff from "../../../application/usecases/Register/RegisterStaff.js";
import RegisterAdmin from "../../../application/usecases/Register/RegisterAdmin.js";
import LoginUser from "../../../application/usecases/Login/LoginUser.js";
import AuthController from "../../../interfaces/controllers/Login/AuthController.js";

import EditStaff from "../../../application/usecases/Staff/EditStaff.js";
import DeleteStaff from "../../../application/usecases/Staff/DeleteStaff.js";
import GetAllStaff from "../../../application/usecases/Staff/GetAllStaff.js";
import { upload, handleCloudinaryUrl } from "../middleware/upload.js";

const router = express.Router();

const repo = new UserRepositoryImpl();

const registerCustomer = new RegisterCustomer(repo);
const registerStaff = new RegisterStaff(repo);
const registerAdmin = new RegisterAdmin(repo);
const loginUser = new LoginUser(repo);
const getAllStaff = new GetAllStaff(repo);
const editStaff = new EditStaff(repo);
const deleteStaff = new DeleteStaff(repo);

const controller = new AuthController(
  registerCustomer,
  registerStaff,
  registerAdmin,
  loginUser,
  getAllStaff,
  editStaff,
  deleteStaff
);

// REGISTER
router.post("/register-customer", controller.registerCustomerHandler);
router.post(
  "/register-staff",
  upload.single("image"),
  handleCloudinaryUrl,
  controller.registerStaffHandler
);
router.post(
  "/register-admin",
  upload.single("image"),
  handleCloudinaryUrl,
  controller.registerAdminHandler
);

// LOGIN
router.post("/login-customer", controller.loginCustomerHandler);
router.post("/login-staff", controller.loginStaffHandler);
router.post("/login-admin", controller.loginAdminHandler);

router.get("/staff", controller.fetchStaffHandler);
router.put("/staff/:id", upload.single("image"), handleCloudinaryUrl, controller.editStaffHandler);
router.delete("/staff/:id", controller.deleteStaffHandler);
export default router;
