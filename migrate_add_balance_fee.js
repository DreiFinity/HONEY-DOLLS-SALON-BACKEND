import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function migrate() {
  try {
    console.log("Adding balance_fee column to reservationpayment...");
    await pool.query(`
      ALTER TABLE reservationpayment 
      ADD COLUMN IF NOT EXISTS balance_fee NUMERIC(10,2) DEFAULT 0.00
    `);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
