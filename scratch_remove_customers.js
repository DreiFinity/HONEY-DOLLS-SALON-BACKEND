import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get all userids that don't have addresses
    const res = await client.query(`
      SELECT c.userid 
      FROM customers c
      LEFT JOIN customer_addresses a ON c.customerid = a.customerid
      WHERE a.addressid IS NULL
    `);
    
    const userIds = res.rows.map(row => row.userid);
    
    if (userIds.length > 0) {
      console.log("Found " + userIds.length + " customers without addresses. Proceeding to delete...");
      
      const deleteCustomersRes = await client.query(
        "DELETE FROM customers WHERE userid = ANY($1::int[]) RETURNING *",
        [userIds]
      );
      
      console.log("Deleted " + deleteCustomersRes.rowCount + " from customers table.");
      
      const deleteUsersRes = await client.query(
        "DELETE FROM users WHERE userid = ANY($1::int[]) RETURNING *",
        [userIds]
      );
      
      console.log("Deleted " + deleteUsersRes.rowCount + " from users table.");
    } else {
      console.log("No customers without addresses found.");
    }

    await client.query("COMMIT");
    console.log("Successfully removed orphaned customers.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to delete customers due to constraints or error:", err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
