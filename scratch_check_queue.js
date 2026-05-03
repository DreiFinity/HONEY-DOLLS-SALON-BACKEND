import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  try {
    await pool.query(`ALTER TABLE queue DROP CONSTRAINT queue_status_check`);
    console.log("Dropped old constraint");
    await pool.query(`ALTER TABLE queue ADD CONSTRAINT queue_status_check CHECK (status IN ('waiting', 'serving', 'pending_payment', 'done', 'skipped', 'cancelled'))`);
    console.log("Added new constraint with pending_payment");
  } catch(e) {
    console.error(e.message);
  } finally {
    process.exit(0);
  }
}
run();
