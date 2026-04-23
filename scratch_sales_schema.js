import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  const tables = ['customerpayment', 'customerpayment_orders', 'orders', 'orderdetails', 'products'];
  for (const table of tables) {
    try {
      const res = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${table}'`
      );
      console.log(`Table: ${table}`);
      console.log(JSON.stringify(res.rows, null, 2));
    } catch(e) {
      console.error(`Error fetching schema for ${table}:`, e.message);
    }
  }
  process.exit(0);
}
run();
