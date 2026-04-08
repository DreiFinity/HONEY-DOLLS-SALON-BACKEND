import { pool } from "./src/infrastructure/db/index.js";

async function check() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log(res.rows.map(r => r.table_name));
  process.exit();
}
check();
