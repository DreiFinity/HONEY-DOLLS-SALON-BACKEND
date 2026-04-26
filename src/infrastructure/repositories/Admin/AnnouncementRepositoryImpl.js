import { pool } from "../../db/index.js";

export default class AnnouncementRepositoryImpl {
  constructor() {
    this.initTable();
  }

  async initTable() {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS announcement (
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
      console.log("✅ Announcement table checked/created.");
    } catch (err) {
      console.error("❌ Failed to create announcement table:", err.message);
    }
  }

  async getAllAnnouncements() {
    const result = await pool.query(
      "SELECT * FROM announcement ORDER BY created_at DESC"
    );
    return result.rows;
  }

  async getActiveAnnouncements(role) {
    let query = "SELECT * FROM announcement WHERE status = 'Published'";
    
    if (role === 'customer') {
      query += " AND audience IN ('All Users', 'Customers Only')";
    } else if (role === 'staff') {
      query += " AND audience IN ('All Users', 'Staff Only')";
    } else {
      query += " AND audience = 'All Users'";
    }
    
    query += " ORDER BY created_at DESC";
    
    const result = await pool.query(query);
    return result.rows;
  }

  async getAnnouncementById(id) {
    const result = await pool.query(
      "SELECT * FROM announcement WHERE id = $1",
      [id]
    );
    return result.rows[0];
  }

  async createAnnouncement(data) {
    const { title, category, content, priority, audience, status, startDate, startTime } = data;
    
    // Convert startDate and startTime to proper types or null if empty
    const sd = startDate || null;
    const st = startTime || null;

    const result = await pool.query(
      `INSERT INTO announcement (title, category, content, priority, audience, status, start_date, start_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, category, content, priority, audience, status, sd, st]
    );
    return result.rows[0];
  }

  async updateAnnouncement(id, data) {
    const { title, category, content, priority, audience, status, startDate, startTime } = data;
    
    const sd = startDate || null;
    const st = startTime || null;

    const result = await pool.query(
      `UPDATE announcement 
       SET title = $1, category = $2, content = $3, priority = $4, audience = $5, status = $6, start_date = $7, start_time = $8
       WHERE id = $9
       RETURNING *`,
      [title, category, content, priority, audience, status, sd, st, id]
    );
    return result.rows[0];
  }

  async deleteAnnouncement(id) {
    const result = await pool.query(
      "DELETE FROM announcement WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  }
}
