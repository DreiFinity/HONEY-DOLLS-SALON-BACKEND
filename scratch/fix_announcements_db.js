
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'salon',
  password: '123456',
  port: 5432,
});

async function checkTable() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'announcements'");
    if (res.rows.length === 0) {
      console.log("TABLE_DOES_NOT_EXIST");
      
      // Let's create it
      await pool.query(`
        CREATE TABLE IF NOT EXISTS announcements (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          content TEXT NOT NULL,
          priority VARCHAR(50),
          audience VARCHAR(100),
          status VARCHAR(50),
          start_date DATE,
          start_time TIME,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("Table 'announcements' created successfully.");
    } else {
      console.log("Columns in announcements:");
      res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkTable();
