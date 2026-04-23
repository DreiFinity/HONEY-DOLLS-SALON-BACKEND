import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: 'your_password', // Need to check password or use env
  port: 5432,
});

async function check() {
  try {
    const res = await pool.query('SELECT staffid, userid, role FROM staff WHERE userid = 50');
    console.log(JSON.stringify(res.rows[0]));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
check();
