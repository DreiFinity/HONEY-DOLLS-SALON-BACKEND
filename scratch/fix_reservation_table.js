import { pool } from '../src/infrastructure/db/index.js';

async function fixTable() {
  try {
    console.log("Checking for customerid column in reservationpayment...");
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'reservationpayment' AND column_name = 'customerid'
    `);

    if (checkRes.rows.length > 0) {
      console.log("Column customerid found. Dropping it to remove redundancy...");
      await pool.query(`ALTER TABLE reservationpayment DROP COLUMN customerid`);
      console.log("Column dropped successfully.");
    } else {
      console.log("Column customerid not found. No action needed.");
    }
  } catch (err) {
    console.error("Error fixing table:", err);
  } finally {
    process.exit();
  }
}

fixTable();
