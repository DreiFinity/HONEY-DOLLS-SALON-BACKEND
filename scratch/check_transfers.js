import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:123456@localhost:5432/salon"
});

async function checkData() {
  try {
    const res = await pool.query(`
      SELECT transferid, reference_code 
      FROM product_transfers 
      ORDER BY transfer_date DESC 
      LIMIT 10
    `);
    console.log("Recent Transfers:", JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkData();
