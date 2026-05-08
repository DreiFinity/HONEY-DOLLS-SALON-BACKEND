import pkg from 'pg';
const { Pool } = pkg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/salon' });

async function check() {
  try {
    const res = await pool.query(`
      SELECT rp.*, q.source 
      FROM reservationpayment rp 
      LEFT JOIN queue q ON rp.queueid = q.queueid 
      WHERE q.source = 'walkin' 
      LIMIT 10
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
