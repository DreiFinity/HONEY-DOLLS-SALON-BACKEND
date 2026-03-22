import express from "express";
import auth from "../../../infrastructure/web/middleware/auth.js";
import getMyProfile, { getProfile, updateProfile, uploadAvatar } from "../../../interfaces/controllers/FetchUser/UserController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/me", auth, getMyProfile);
router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.post("/profile/avatar", auth, upload.single("avatar"), uploadAvatar);

export default router;
