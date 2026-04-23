import { pool } from "./src/infrastructure/db/index.js";

async function run() {
  try {
    const res = await pool.query(`
      SELECT c.customerid, c.firstname, c.lastname, u.email, u.userid
      FROM customers c
      JOIN users u ON c.userid = u.userid
      LEFT JOIN customer_addresses a ON c.customerid = a.customerid
      WHERE a.addressid IS NULL
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('Total customers without addresses:', res.rows.length);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
