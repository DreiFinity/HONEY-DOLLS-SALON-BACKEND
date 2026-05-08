import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function getQueueCols() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'queue'");
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

getQueueCols();
