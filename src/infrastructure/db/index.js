import pkg from "pg";
import { config } from "../../config/env.js"; // go up 2 levels from db to config
import { v4 as uuidv4 } from "uuid";

const { Pool } = pkg;

export const pool = new Pool(
  config.db.url 
    ? { 
        connectionString: config.db.url,
        ssl: { rejectUnauthorized: false } // Required for cloud databases like Supabase
      }
    : {
        host: config.db.host,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        port: config.db.port,
      }
);

pool
  .connect()
  .then(async () => {
    console.log("✅ Connected to PostgreSQL");
    try {
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 1.0;");
      console.log("✅ self-healing: weight_kg column verified/added to products table");
      
      await pool.query("ALTER TABLE product_adjustments ADD COLUMN IF NOT EXISTS reference_code VARCHAR(50);");
      console.log("✅ self-healing: reference_code column verified/added to product_adjustments table");

      await pool.query("ALTER TABLE product_returns ADD COLUMN IF NOT EXISTS reference_code VARCHAR(50);");
      console.log("✅ self-healing: reference_code column verified/added to product_returns table");

      await pool.query("ALTER TABLE product_transfers ADD COLUMN IF NOT EXISTS reference_code VARCHAR(50);");
      console.log("✅ self-healing: reference_code column verified/added to product_transfers table");

      await pool.query(`
        ALTER TABLE supplierpurchase 
        ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'IMMEDIATE',
        ADD COLUMN IF NOT EXISTS payment_term_days INTEGER DEFAULT 0;
      `);
      console.log("✅ self-healing: supplierpurchase payment columns verified/added");
    } catch (dbErr) {
      console.error("❌ Error running self-healing schema updates:", dbErr);
    }
  })
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
export async function getCustomerByUserId(userId) {
  const res = await pool.query(
    "SELECT customerid FROM customers WHERE userid = $1",
    [userId],
  );
  return res.rows[0]; // returns { customerid: 3 } or undefined
}

export default {
  pool,
  getActiveSession,
  createOrUpdateActiveSession,
  updateActiveSessionLastRoute,
  getCustomerByUserId,
};
