
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function checkImageLength() {
  try {
    const res = await pool.query("SELECT character_maximum_length FROM information_schema.columns WHERE table_name = 'service' AND column_name = 'image'");
    console.log(res.rows[0]);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkImageLength();
