// server.js
const express = require("express");
const { config } = require("./config/env");
const { pool } = require("./db/index");

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Server running!", dbTime: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
});
