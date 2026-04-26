import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function checkAnnouncementsSchema() {
  try {
    const res1 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'announcements'");
    console.log("Columns in announcements:");
    res1.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    
    const res2 = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'announcement'");
    console.log("Columns in announcement:");
    res2.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkAnnouncementsSchema();
