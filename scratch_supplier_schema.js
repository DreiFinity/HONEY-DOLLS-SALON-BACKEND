import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  try {
    const res = await pool.query(
      "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'supplier'"
    );
    console.log(JSON.stringify(res.rows, null, 2));
    
    // Also try plural 'suppliers'
    const res2 = await pool.query(
      "SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'suppliers'"
    );
    console.log("Plural:", JSON.stringify(res2.rows, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
