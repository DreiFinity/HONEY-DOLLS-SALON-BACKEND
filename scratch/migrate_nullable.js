import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'nagba_db',
  password: 'password', // Standard password usually, or let it fail if not needed
  port: 5432,
});

async function migrate() {
  try {
    console.log("Checking if appointmentid is nullable...");
    await pool.query("ALTER TABLE reservationpayment ALTER COLUMN appointmentid DROP NOT NULL;");
    console.log("Success: appointmentid is now nullable.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
