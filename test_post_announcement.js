import axios from "axios";
import jwt from "jsonwebtoken";
import { config } from "./src/config/env.js";

async function testPost() {
  const token = jwt.sign(
    {
      id: 1,
      role: "admin",
      login_id: "test-session"
    },
    config.jwtSecret,
    { expiresIn: "24h" }
  );

  try {
    const res = await axios.post("http://localhost:3000/api/announcements", {
      title: "Test Announcement",
      content: "This is a test",
      category: "General",
      priority: "high",
      audience: "All Users",
      status: "Published",
      startDate: "",
      startTime: ""
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

testPost();
