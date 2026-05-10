import pkg from "pg";
const { Pool } = pkg;
import { config } from "../src/config/env.js";

const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
});

async function migrateTermsToPurchase() {
  try {
    console.log("Adding payment_type and payment_term_days to supplierpurchase...");
    await pool.query(`
      ALTER TABLE supplierpurchase 
      ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'IMMEDIATE',
      ADD COLUMN IF NOT EXISTS payment_term_days INTEGER DEFAULT 0;
    `);
    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

migrateTermsToPurchase();
