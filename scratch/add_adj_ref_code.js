
import { pool } from '../src/infrastructure/db/index.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Adding reference_code to product_adjustments...');
    await client.query(`
      ALTER TABLE product_adjustments 
      ADD COLUMN IF NOT EXISTS reference_code VARCHAR(50);
    `);

    await client.query('COMMIT');
    console.log('Migration successful: reference_code added to product_adjustments');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
