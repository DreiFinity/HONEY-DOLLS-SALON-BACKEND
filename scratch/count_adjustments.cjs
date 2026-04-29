const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function check() {
  try {
    const res = await pool.query(`SELECT count(*) FROM product_adjustments;`);
    console.log(`TOTAL_ADJUSTMENTS: ${res.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
