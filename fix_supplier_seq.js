import { pool } from './src/infrastructure/db/index.js';

async function fix() {
  try {
    const r = await pool.query(
      `SELECT setval(pg_get_serial_sequence('supplier', 'supplierid'), COALESCE((SELECT MAX(supplierid) FROM supplier), 1))`
    );
    console.log('✅ Supplier sequence reset to:', r.rows[0].setval);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

fix();
