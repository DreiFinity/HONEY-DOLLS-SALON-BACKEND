import jwt from "jsonwebtoken";
import { config } from "./src/config/env.js";

// Generate an admin token manually
const token = jwt.sign(
  {
    id: 1, // assume user 1 is admin
    role: "admin",
    login_id: "test-login-id" // We might need this for auth middleware? Wait, auth middleware checks active_sessions!
  },
  config.jwtSecret,
  { expiresIn: "24h" }
);

console.log("Token:", token);
