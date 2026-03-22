import express from "express";
import auth from "../middleware/auth.js";
import {
  createAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} from "../../../interfaces/controllers/Customer/CustomerAddressController.js";

const router = express.Router();

router.post("/", auth, createAddress);
router.get("/", auth, getAddresses);
router.put("/:id", auth, updateAddress);
router.delete("/:id", auth, deleteAddress);

export default router;
