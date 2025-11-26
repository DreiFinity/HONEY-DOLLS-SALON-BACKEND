// src/infrastructure/routes/productRoutes.js
import express from "express";
import { upload } from "../middleware/upload.js";
import Product from "../models/Product.js"; // adjust your model import

const router = express.Router();

// POST /api/products
router.post("/create", upload.single("prodimage"), async (req, res) => {
  try {
    const { name, category, unitCost } = req.body;

    if (!name || !category || !unitCost) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Get uploaded file
    const imageFile = req.file ? req.file.filename : null;

    // Create product
    const newProduct = await Product.create({
      name,
      category,
      unitCost: parseFloat(unitCost),
      image: imageFile, // save filename in DB
    });

    return res
      .status(201)
      .json({ message: "Product created", product: newProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

export default router;
