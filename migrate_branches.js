import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  try {
    await pool.query("ALTER TABLE customerpayment ADD COLUMN fulfillment_branchid INT NULL;");
    console.log("Success adding fulfillment_branchid to customerpayment");
  } catch (err) {
    console.error("Error:", err.message);
  }
  process.exit();
}
run();
