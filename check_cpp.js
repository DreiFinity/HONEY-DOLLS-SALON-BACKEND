import { pool } from "./src/infrastructure/db/index.js";

async function check() {
  try {
    const res = await pool.query("SELECT * FROM customerproductpayment LIMIT 1");
    console.log(res.rows[0]);
    process.exit();
  } catch(e) { console.log(e.message); }
}
check();
