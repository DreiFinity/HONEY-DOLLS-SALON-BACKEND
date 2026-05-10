import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import { config } from "../../../config/env.js";
import path from "path";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Setup Cloudinary Storage
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "salon_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    public_id: (req, file) => {
      const name = file.originalname.split(".")[0];
      return `${Date.now()}-${name}`;
    },
  },
});

// Fallback Local Storage
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), "upload"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const storage = config.cloudinary.apiKey ? cloudinaryStorage : localStorage;
const uploadRaw = multer({ storage });

// Helper middleware to ensure Cloudinary URL is used as the filename
// This avoids having to change every controller in the project
export const handleCloudinaryUrl = (req, res, next) => {
  if (req.file && req.file.path && req.file.path.startsWith('http')) {
    req.file.filename = req.file.path;
  }
  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      if (file.path && file.path.startsWith('http')) {
        file.filename = file.path;
      }
    });
  }
  next();
};

export const upload = uploadRaw;
