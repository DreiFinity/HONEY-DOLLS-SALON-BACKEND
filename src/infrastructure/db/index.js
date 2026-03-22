import pkg from "pg";
import { config } from "../../config/env.js"; // go up 2 levels from db to config

const { Pool } = pkg;

export const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
});

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB connection error:", err));

// Get active session for a user
export async function getActiveSession(userId) {
  const res = await pool.query(
    "SELECT * FROM active_sessions WHERE user_id = $1",
    [userId],
  );
  return res.rows[0];
}

// Create or update active session
export async function createOrUpdateActiveSession(userId, loginId, lastRoute) {
  await pool.query(
    `
    INSERT INTO active_sessions(user_id, login_id, last_route)
    VALUES($1, $2, $3)
    ON CONFLICT (user_id)
    DO UPDATE SET login_id = $2, last_route = $3, updated_at = NOW()
  `,
    [userId, loginId, lastRoute],
  );
}
//andrei bayot
// Update last route for resume activity
export async function updateActiveSessionLastRoute(userId, lastRoute) {
  await pool.query(
    `
    UPDATE active_sessions
    SET last_route = $2, updated_at = NOW()
    WHERE user_id = $1
  `,
    [userId, lastRoute],
  );
}

export default {
  pool,
  getActiveSession,
  createOrUpdateActiveSession,
  updateActiveSessionLastRoute,
};
