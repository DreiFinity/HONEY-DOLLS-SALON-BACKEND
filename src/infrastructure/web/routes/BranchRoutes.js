// src/infrastructure/web/routes/BranchRoutes.js
import { Router } from "express";
import BranchController from "../../../interfaces/controllers/Branch/BranchController.js";
import BranchRepositoryImpl from "../../repositories/Branch/BranchRepositoryImpl.js";

const router = Router();
const branchRepository = new BranchRepositoryImpl();
const controller = new BranchController(branchRepository);

router.get("/", controller.getAll.bind(controller));

export default router;
