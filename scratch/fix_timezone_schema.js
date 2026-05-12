
import { pool } from '../src/infrastructure/db/index.js';

async function fixTimezones() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("Altering appointment table columns to TIMESTAMPTZ...");
    await client.query(`
      ALTER TABLE appointment 
      ALTER COLUMN starttime TYPE TIMESTAMPTZ USING starttime AT TIME ZONE 'UTC',
      ALTER COLUMN endtime TYPE TIMESTAMPTZ USING endtime AT TIME ZONE 'UTC',
      ALTER COLUMN updatedat TYPE TIMESTAMPTZ USING updatedat AT TIME ZONE 'UTC'
    `);

    console.log("Altering queue table columns to TIMESTAMPTZ...");
    await client.query(`
      ALTER TABLE queue 
      ALTER COLUMN arrivaltime TYPE TIMESTAMPTZ USING arrivaltime AT TIME ZONE 'UTC',
      ALTER COLUMN updatedat TYPE TIMESTAMPTZ USING updatedat AT TIME ZONE 'UTC'
    `);

    console.log("Altering reservationpayment table columns to TIMESTAMPTZ...");
    await client.query(`
      ALTER TABLE reservationpayment 
      ALTER COLUMN paid_at TYPE TIMESTAMPTZ USING paid_at AT TIME ZONE 'UTC',
      ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC'
    `);

    await client.query('COMMIT');
    console.log("Successfully updated columns to TIMESTAMPTZ.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error during migration:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTimezones();
