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
    const users = await pool.query("SELECT userid, username, email, role FROM users");
    console.log("All Users:", users.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
debug();
