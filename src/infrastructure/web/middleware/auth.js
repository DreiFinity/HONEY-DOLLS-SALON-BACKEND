// import jwt from "jsonwebtoken";

// export default function auth(req, res, next) {
//   const header = req.headers.authorization;
//   if (!header) return res.status(401).json({ message: "Missing token" });

//   const token = header.split(" ")[1];

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = {
//       id: decoded.id,
//       role: decoded.role,
//     };
//     // <-- we need this
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid token" });
//   }
// }

// // src/infrastructure/middleware/auth.js
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
    const activeSession = await db.getActiveSession(decoded.id);

    if (!activeSession || activeSession.login_id !== decoded.login_id) {
      return res
        .status(401)
        .json({ message: "Session expired or another login detected" });
    }

    // 2️⃣ Attach user info to req
    req.user = { id: decoded.id, role: decoded.role };

    next();
  } catch (err) {
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
