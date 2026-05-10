
import { pool } from '../src/infrastructure/db/index.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tables = ['orders', 'customerpayment', 'product_transfers', 'product_returns'];
    
    for (const table of tables) {
      console.log(`Adding reference_code to ${table} if missing...`);
      await client.query(`
        ALTER TABLE ${table} 
        ADD COLUMN IF NOT EXISTS reference_code VARCHAR(50);
      `);
    }

    await client.query('COMMIT');
    console.log('Migration successful: reference_code columns verified/added.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
