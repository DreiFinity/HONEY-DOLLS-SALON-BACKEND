import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

export const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
  },
  jwtSecret: process.env.JWT_SECRET || "supersecretkey",
  paymongoSecret: process.env.PAYMONGO_SECRET_KEY,
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};
