import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";

export class LoginStaff {
  constructor(pool) {           // ← NOW WE TAKE POOL DIRECTLY
    this.pool = pool;
  }

  async execute({ email, password }) {
    // 1. Find user
    const userRes = await this.pool.query(
      "SELECT userid, password, role, email FROM users WHERE email = $1",
      [email]
    );
    const user = userRes.rows[0];
    if (!user) throw new Error("Invalid email or password");

    // 2. Check password (temporary)
    if (user.password !== password) throw new Error("Invalid email or password");

    // 3. Only staff
    if (user.role !== "staff") throw new Error("Access denied: This login is for salon staff only");

    // 4. Get staff profile
    const staffRes = await this.pool.query(
      "SELECT staffid, firstname, lastname, contact FROM staff WHERE userid = $1",
      [user.userid]
    );
    const staff = staffRes.rows[0];
    if (!staff) throw new Error("Staff profile not found");

    // 5. Token
    const token = jwt.sign(
      { id: user.userid, role: user.role },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

    // 6. Final clean response
    return {
      token,
      user: {
        userid: user.userid,
        staffid: staff.staffid,
        firstname: staff.firstname,
        lastname: staff.lastname,
        contact: staff.contact,
        email: user.email,
        role: user.role,
      },
    };
  }
}