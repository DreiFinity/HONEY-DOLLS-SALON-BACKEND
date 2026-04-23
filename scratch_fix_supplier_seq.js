import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  try {
    const res = await pool.query("SELECT setval(pg_get_serial_sequence('supplier', 'supplierid'), coalesce(max(supplierid), 1), max(supplierid) IS NOT null) FROM supplier;");
    console.log("Sequence updated:", res.rows[0]);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
