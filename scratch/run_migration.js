import { pool } from "../src/infrastructure/db/index.js";

async function run() {
  console.log("Running migration to add product weight and size columns...");
  try {
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS weight_gms integer DEFAULT 150,
      ADD COLUMN IF NOT EXISTS length_cm numeric DEFAULT 5.0,
      ADD COLUMN IF NOT EXISTS width_cm numeric DEFAULT 5.0,
      ADD COLUMN IF NOT EXISTS height_cm numeric DEFAULT 10.0;
    `);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    process.exit();
  }
}

run();
