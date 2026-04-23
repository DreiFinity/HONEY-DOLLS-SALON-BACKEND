import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Create the sequence if it doesn't exist
    await client.query("CREATE SEQUENCE IF NOT EXISTS branch_branchid_seq");

    // 2. Set the default value for branchid to use the sequence
    // Note: In Postgres, you can use ALTER TABLE ... ALTER COLUMN ... SET DEFAULT
    await client.query("ALTER TABLE branch ALTER COLUMN branchid SET DEFAULT nextval('branch_branchid_seq')");

    // 3. Associate the sequence with the column so it's dropped if the column is dropped
    await client.query("ALTER SEQUENCE branch_branchid_seq OWNED BY branch.branchid");

    // 4. Sync the sequence with the existing maximum ID
    await client.query("SELECT setval('branch_branchid_seq', coalesce(max(branchid), 1), max(branchid) IS NOT null) FROM branch");

    await client.query("COMMIT");
    console.log("Branch table branchid column fixed with sequence.");
  } catch(e) {
    await client.query("ROLLBACK");
    console.error("Failed to fix branch table:", e.message);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
