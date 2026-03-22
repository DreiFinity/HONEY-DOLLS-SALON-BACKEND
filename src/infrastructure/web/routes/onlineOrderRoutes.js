import express from "express";
import {
  createOnlineOrder,
  getCustomerOrders, // ✅ instead of getAllOnlineOrders
  getOnlineOrderById,
  updateOnlineOrder,
  deleteOnlineOrder,
  updateOnlineOrderQuantity,
} from "../../../interfaces/controllers/Order/OnlineOrderController.js";

import auth, { trackLastRoute } from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = express.Router();

// Authentication + customer role check
router.use(auth);
router.use(trackLastRoute);
router.use(roleCheck("customer"));

// CRUD routes
router.post("/", auth, roleCheck("customer"), createOnlineOrder);
router.get("/", auth, roleCheck("customer"), getCustomerOrders);
router.get("/:id", auth, roleCheck("customer"), getOnlineOrderById);
router.put("/:id", auth, roleCheck("customer"), updateOnlineOrder);
router.put("/:id/quantity", auth, roleCheck("customer"), updateOnlineOrderQuantity);
router.delete("/:id", auth, roleCheck("customer"), deleteOnlineOrder);

export default router;
