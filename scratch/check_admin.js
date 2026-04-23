import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: '1234',
  database: 'salon',
  port: 5432,
});

async function debug() {
  try {
    const admin = await pool.query("SELECT * FROM admin");
    console.log("Admins:", admin.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
debug();
