
import { pool } from '../src/infrastructure/db/index.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add columns to supplierpayment
    await client.query(`
      ALTER TABLE supplierpayment 
      ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'IMMEDIATE',
      ADD COLUMN IF NOT EXISTS payment_term_days INTEGER DEFAULT 0;
    `);

    // 2. Remove columns from supplierpurchase
    await client.query(`
      ALTER TABLE supplierpurchase 
      DROP COLUMN IF EXISTS payment_type,
      DROP COLUMN IF EXISTS payment_term_days;
    `);

    await client.query('COMMIT');
    console.log('Migration successful: payment terms moved to supplierpayment');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

migrate();
