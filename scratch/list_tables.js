import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables:");
    res.rows.forEach(row => console.log(row.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

listTables();
