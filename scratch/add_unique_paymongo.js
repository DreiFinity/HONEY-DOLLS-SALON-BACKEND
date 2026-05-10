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

async function addUniqueConstraint() {
  try {
    console.log("Adding UNIQUE constraint to paymongo_id in supplierpayment...");
    // Check if it exists first
    const check = await pool.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conname = 'supplierpayment_paymongo_id_key';
    `);

    if (check.rowCount === 0) {
      await pool.query("ALTER TABLE supplierpayment ADD CONSTRAINT supplierpayment_paymongo_id_key UNIQUE (paymongo_id);");
      console.log("Constraint added.");
    } else {
      console.log("Constraint already exists.");
    }
  } catch (err) {
    console.error("Error adding constraint:", err);
  } finally {
    await pool.end();
  }
}

addUniqueConstraint();
