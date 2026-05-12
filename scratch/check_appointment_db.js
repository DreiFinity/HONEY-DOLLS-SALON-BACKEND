
import { pool } from '../src/infrastructure/db/index.js';

async function checkTable() {
  const client = await pool.connect();
  try {
    console.log("Checking appointment table structure...");
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'appointment'
    `);
    console.table(res.rows);

    const res2 = await client.query(`SHOW timezone`);
    console.log("Database Timezone:", res2.rows[0]);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTable();
