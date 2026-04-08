import { pool } from "./src/infrastructure/db/index.js";

async function check() {
  const res = await pool.query("SELECT * FROM branch_inventory LIMIT 1");
  console.log(Object.keys(res.rows[0] || {}));
  process.exit();
}
check();
