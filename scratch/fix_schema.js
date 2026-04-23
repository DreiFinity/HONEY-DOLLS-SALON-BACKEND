import { pool } from "../src/infrastructure/db/index.js";

async function check() {
  try {
    console.log("Setting lock timeout...");
    await pool.query("SET lock_timeout = '5s'");
    
    console.log("Attempting to add foreign key to appointment table...");
    // First, check if the table is 'branches' or 'branch'
    const tableRes = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'branches'");
    const tableName = tableRes.rows.length > 0 ? 'branches' : 'branch';
    console.log(`Using table name: ${tableName}`);

    await pool.query(`ALTER TABLE appointment ADD CONSTRAINT fk_appointment_branchid FOREIGN KEY (branchid) REFERENCES ${tableName}(branchid) ON DELETE SET NULL`);
    console.log("Success: added foreign key to appointment");
    
    process.exit(0);
  } catch (err) {
    console.error("Error adding constraint:", err.message);
    process.exit(1);
  }
}

check();
