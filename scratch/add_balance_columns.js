import { pool } from '../src/infrastructure/db/index.js';

async function updateSchema() {
  try {
    console.log("Adding balance payment columns to reservationpayment table...");
    await pool.query(`
      ALTER TABLE reservationpayment 
      ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10,2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS balance_paymongo_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS balance_status VARCHAR(20) DEFAULT 'unpaid',
      ADD COLUMN IF NOT EXISTS balance_checkout_url TEXT,
      ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMP WITHOUT TIME ZONE
    `);
    console.log("Columns added successfully!");
  } catch (err) {
    console.error("Error updating schema:", err.message);
  } finally {
    process.exit();
  }
}

updateSchema();
