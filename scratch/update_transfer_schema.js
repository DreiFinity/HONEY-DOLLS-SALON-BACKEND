import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: "postgresql://postgres:123456@localhost:5432/salon"
});

async function updateSchema() {
  try {
    console.log("Checking for reference_code in product_transfers...");
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_transfers' AND column_name = 'reference_code'
    `);

    if (checkRes.rows.length === 0) {
      console.log("Adding reference_code column to product_transfers...");
      await pool.query(`ALTER TABLE product_transfers ADD COLUMN reference_code VARCHAR(50)`);
      console.log("Column added.");
    } else {
      console.log("Column reference_code already exists.");
    }
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await pool.end();
  }
}

updateSchema();
