import { pool } from "./src/infrastructure/db/index.js";
import fs from "fs";

async function run() {
  try {
    const res = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'supplier'"
    );
    fs.writeFileSync("supplier_schema.json", JSON.stringify(res.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
