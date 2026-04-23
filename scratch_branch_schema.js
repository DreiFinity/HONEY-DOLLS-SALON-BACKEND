import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  try {
    const res = await pool.query(
      "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'branch'"
    );
    console.log(JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
