// src/infrastructure/web/routes/AuthRoutes.js
import express from "express";
import UserRepositoryImpl from "../../repositories/Login/UserRepositoryImpl.js";
import RegisterCustomer from "../../../application/usecases/Login/RegisterCustomer.js";
import RegisterStaff from "../../../application/usecases/Login/RegisterStaff.js";
import RegisterAdmin from "../../../application/usecases/Login/RegisterAdmin.js";
import { LoginUser } from "../../../application/usecases/Login/LoginUser.js";
import AuthController from "../../../interfaces/controllers/Login/AuthController.js";

const router = express.Router();

const repo = new UserRepositoryImpl();

const registerCustomer = new RegisterCustomer(repo);
const registerStaff = new RegisterStaff(repo);
const registerAdmin = new RegisterAdmin(repo);
const loginUser = new LoginUser(repo);

const controller = new AuthController(
  registerCustomer,
  registerStaff,
  registerAdmin,
  loginUser
);

// REGISTER
router.post("/register-customer", controller.registerCustomerHandler);
router.post("/register-staff", controller.registerStaffHandler);
router.post("/register-admin", controller.registerAdminHandler);

// LOGIN
router.post("/login-customer", controller.loginCustomerHandler);
router.post("/login-staff", controller.loginStaffHandler);
router.post("/login-admin", controller.loginAdminHandler);

export default router;
