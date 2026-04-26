
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function checkServiceSchema() {
  try {
    const res = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'service'");
    console.log("Columns in service:");
    res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type} (Nullable: ${row.is_nullable})`));
    
    const res2 = await pool.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'service'::regclass");
    console.log("\nConstraints in service:");
    res2.rows.forEach(row => console.log(`${row.conname}: ${row.pg_get_constraintdef}`));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkServiceSchema();
