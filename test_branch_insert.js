import { pool } from "./src/infrastructure/db/index.js";

async function test() {
  try {
    console.log("Testing branch insertion...");
    const res = await pool.query(
      "INSERT INTO branch (branchname, location) VALUES ($1, $2) RETURNING *",
      ["Test Branch", "Test Location"]
    );
    console.log("Success! Created branch:", res.rows[0]);
    
    // Clean up
    await pool.query("DELETE FROM branch WHERE branchid = $1", [res.rows[0].branchid]);
    console.log("Cleaned up test branch.");
  } catch (err) {
    console.error("Test failed with error:", err.message);
    if (err.detail) console.error("Detail:", err.detail);
    if (err.where) console.error("Where:", err.where);
  } finally {
    process.exit(0);
  }
}

test();
