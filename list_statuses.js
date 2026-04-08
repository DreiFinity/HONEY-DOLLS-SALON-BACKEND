import { pool } from "./src/infrastructure/db/index.js";

async function check() {
  const res = await pool.query("SELECT DISTINCT status FROM customerpayment");
  console.log(res.rows);
  process.exit();
}
check();
