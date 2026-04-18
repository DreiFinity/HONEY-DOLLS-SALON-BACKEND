import { pool } from '../src/infrastructure/db/index.js';

async function check() {
  try {
    const res = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'reservationpayment'");
    console.log("Columns in reservationpayment:", res.rows);
  } catch (err) {
    console.error("Error checking columns:", err);
  } finally {
    process.exit();
  }
}

check();
