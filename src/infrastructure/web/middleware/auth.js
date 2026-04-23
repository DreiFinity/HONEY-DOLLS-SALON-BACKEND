import jwt from "jsonwebtoken";
import db from "../../db/index.js"; // import your DB functions
import { config } from "../../../config/env.js"; // or use process.env.JWT_SECRET

export default async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "Missing token" });

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // 1️⃣ Check active session from DB
    let activeSession;
    try {
      activeSession = await db.getActiveSession(decoded.id);
    } catch (dbErr) {
      console.error("DB Error in auth middleware:", dbErr.message);
      return res.status(500).json({ message: "Internal server error during auth" });
    }

    if (!activeSession || activeSession.login_id !== decoded.login_id) {
      console.log("Auth failed: Session mismatch or missing", {
        sessionId: activeSession ? activeSession.login_id : "none",
        tokenSessionId: decoded.login_id,
        userId: decoded.id
      });
      return res
        .status(401)
        .json({ message: "Session expired or another login detected" });
    }

    const customer = await db.getCustomerByUserId(decoded.id);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      customerid: customer ? customer.customerid : null,
      specializations: decoded.specializations || null,
      branchid: decoded.branchid || null,
    };
    // 🔹 DEBUG: check logged-in user info
    // console.log("REQ.USER after auth:", req.user);

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

// Optional middleware to track last route
export async function trackLastRoute(req, res, next) {
  if (req.user) {
    await db.updateActiveSessionLastRoute(req.user.id, req.originalUrl);
  }
  next();
}


