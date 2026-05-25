import { pool } from "../../db/index.js";

export default class SettingsRepositoryImpl {
  async getAll() {
    const res = await pool.query("SELECT key, value FROM settings");
    const settingsMap = {};
    res.rows.forEach(r => {
      settingsMap[r.key] = r.value;
    });
    return settingsMap;
  }

  async getByKey(key) {
    const res = await pool.query("SELECT value FROM settings WHERE key = $1", [key]);
    if (res.rows.length === 0) return null;
    return res.rows[0].value;
  }

  async update(key, value) {
    const res = await pool.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2
       RETURNING *`,
      [key, String(value)]
    );
    return res.rows[0];
  }
}
