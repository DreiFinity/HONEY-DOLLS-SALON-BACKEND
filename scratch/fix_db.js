import { pool } from "./src/infrastructure/db/index.js";

async function fix() {
  try {
    console.log("Adding role column...");
    await pool.query("ALTER TABLE staff ADD COLUMN IF NOT EXISTS role TEXT[] DEFAULT '{}'");
    console.log("Column added successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error adding column:", err);
    process.exit(1);
  }
}

fix();
