// src/server.js
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { config } from "./config/env.js";
import { pool } from "./infrastructure/db/index.js"; // correct path
import LoginRoutes from "./infrastructure/web/routes/LoginRoutes.js";
import RegisterRoutes from "./infrastructure/web/routes/RegisterRoutes.js";
import { UserRepositoryImpl } from "./infrastructure/repositories/Login/UserRepositoryImpl.js";
import { BcryptService } from "./infrastructure/security/BcryptService.js";

const userRepository = new UserRepositoryImpl();
const hashService = new BcryptService();

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use(express.json());

// Routes
app.use("/api/user", LoginRoutes);
app.use("/api/register", RegisterRoutes(userRepository, hashService));

// Test route
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Server running!", dbTime: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = config.port || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
