
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function listSessionColumns() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'active_sessions'");
    console.log("Columns in active_sessions:");
    res.rows.forEach(row => console.log(row.column_name));
    
    const res2 = await pool.query("SELECT * FROM active_sessions LIMIT 1");
    console.log("\nSample session:");
    console.log(res2.rows[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

listSessionColumns();
