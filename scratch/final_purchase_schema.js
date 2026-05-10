import pkg from "pg";
const { Pool } = pkg;
import { config } from "./src/config/env.js";

const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
});

async function updateSchema() {
  try {
    console.log("Checking for columns in supplierpurchase table...");
    
    // Add columns to supplierpurchase
    const purchaseCols = [
      { name: 'payment_type', type: 'TEXT', default: "'IMMEDIATE'" }, // IMMEDIATE or PAYLATER
      { name: 'payment_term_days', type: 'INTEGER', default: '0' },
      { name: 'downpayment', type: 'NUMERIC(12,2)', default: '0.00' }
    ];

    for (const col of purchaseCols) {
      const check = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='supplierpurchase' AND column_name=$1`, [col.name]);
      if (check.rowCount === 0) {
        console.log(`Adding ${col.name} to supplierpurchase...`);
        await pool.query(`ALTER TABLE supplierpurchase ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}`);
      }
    }

    console.log("Schema update completed successfully.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await pool.end();
  }
}

updateSchema();
