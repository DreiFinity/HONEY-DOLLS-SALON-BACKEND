
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function checkServiceId() {
  try {
    const res = await pool.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'service' AND column_name = 'serviceid'");
    console.log(res.rows[0]);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkServiceId();
