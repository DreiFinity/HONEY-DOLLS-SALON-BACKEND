
import { pool } from '../src/infrastructure/db/index.js';

async function checkProcurement() {
  const client = await pool.connect();
  try {
    console.log("Checking Procurement table structures...");

    const tables = ['supplierpurchase', 'supplierpurchasedetails', 'supplierpayment', 'supplier'];
    
    for (const table of tables) {
      console.log(`\nTable: ${table}`);
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
      `, [table]);
      console.table(res.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkProcurement();
