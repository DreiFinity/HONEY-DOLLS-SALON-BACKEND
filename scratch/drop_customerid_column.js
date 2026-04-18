import { pool } from '../src/infrastructure/db/index.js';

async function dropColumn() {
  try {
    console.log("Attempting to drop redundant column 'customerid' from 'reservationpayment'...");
    await pool.query("ALTER TABLE reservationpayment DROP COLUMN customerid");
    console.log("Column 'customerid' dropped successfully!");
  } catch (err) {
    console.error("Error dropping column:", err.message);
  } finally {
    process.exit();
  }
}

dropColumn();
