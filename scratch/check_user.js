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
    const userRes = await pool.query("SELECT userid, role FROM users WHERE email = 'john@example.com'");
    console.log("User:", userRes.rows);
    if (userRes.rows.length > 0) {
      const custRes = await pool.query("SELECT * FROM customers WHERE userid = $1", [userRes.rows[0].userid]);
      console.log("Customer Profile:", custRes.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
debug();
