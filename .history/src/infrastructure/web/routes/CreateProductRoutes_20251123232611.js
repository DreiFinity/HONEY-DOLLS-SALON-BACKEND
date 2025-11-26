const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Product = require("../../db/models/Product");

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// POST /products
router.post("/products", upload.single("prodimage"), async (req, res) => {
  try {
    const { prodname, prodcat, price } = req.body;
    const prodimage = req.file ? req.file.filename : null;

    const product = await Product.create({
      prodname,
      prodcat,
      price,
      prodimage,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to create product" });
  }
});

module.exports = router;
