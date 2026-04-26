import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "salon",
  password: "123456",
  port: 5432,
});

async function testInsert() {
  try {
    const data = {
      title: "Test",
      category: "General",
      content: "Test Content",
      priority: "low",
      audience: "All Users",
      status: "Draft",
      startDate: "",
      startTime: ""
    };
    
    const { title, category, content, priority, audience, status, startDate, startTime } = data;
    
    const sd = startDate || null;
    const st = startTime || null;

    console.log("Values:", [title, category, content, priority, audience, status, sd, st]);

    const result = await pool.query(
      `INSERT INTO announcements (title, category, content, priority, audience, status, start_date, start_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, category, content, priority, audience, status, sd, st]
    );
    console.log("Success:", result.rows[0]);
  } catch (err) {
    console.error("Error inserting:", err.message);
  } finally {
    pool.end();
  }
}

testInsert();
