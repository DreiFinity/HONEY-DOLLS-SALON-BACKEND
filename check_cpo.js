import { pool } from "./src/infrastructure/db/index.js";

async function check() {
  const res = await pool.query("SELECT * FROM customerpayment_orders LIMIT 1");
  console.log(res.rows[0]);
  process.exit();
}
check();
