
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function checkSessions() {
  try {
    const res = await pool.query("SELECT * FROM active_sessions ORDER BY last_active DESC LIMIT 1");
    console.log(res.rows[0]);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkSessions();
