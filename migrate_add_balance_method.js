import { pool } from "./src/infrastructure/db/index.js";

async function migrate() {
  try {
    console.log("Adding balance_method to reservationpayment...");
    await pool.query(`
      ALTER TABLE reservationpayment 
      ADD COLUMN IF NOT EXISTS balance_method VARCHAR(50);
    `);
    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
