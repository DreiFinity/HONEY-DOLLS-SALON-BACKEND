import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/salon',
});

async function checkColumns() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'customers'");
    console.log('Customers columns:', res.rows.map(r => r.column_name));
    
    const resUsers = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log('Users columns:', resUsers.rows.map(r => r.column_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkColumns();
