import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function migrate() {
  try {
    console.log("Adding queueid column to reservationpayment...");
    await pool.query("ALTER TABLE reservationpayment ADD COLUMN IF NOT EXISTS queueid INTEGER REFERENCES queue(queueid);");
    await pool.query("ALTER TABLE reservationpayment ALTER COLUMN appointmentid DROP NOT NULL;");
    console.log("Success: reservationpayment table updated.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
