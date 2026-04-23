import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";
import bcrypt from "bcryptjs";

export class LoginStaff {
  constructor(pool) {
    this.pool = pool;
  }

  async execute({ email, password }) {
    const userRes = await this.pool.query(
      "SELECT userid, password, role, email FROM users WHERE email = $1",
      [email]
    );
    const user = userRes.rows[0];
    if (!user) throw new Error("Invalid email or password");

    // Use bcrypt.compare for hashed passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new Error("Invalid email or password");

    if (user.role !== "staff")
      throw new Error("Access denied: This login is for salon staff only");

    const staffRes = await this.pool.query(
      "SELECT staffid, firstname, lastname, contact, role, branchid FROM staff WHERE userid = $1",
      [user.userid]
    );
    const staff = staffRes.rows[0];
    if (!staff) throw new Error("Staff profile not found");

    // Session Management (Required by auth middleware)
    const sessionRes = await this.pool.query(
      "SELECT login_id FROM active_sessions WHERE userid = $1",
      [user.userid]
    );
    let loginId = sessionRes.rows[0]?.login_id;

    if (!loginId) {
      const newSessionRes = await this.pool.query(
        "INSERT INTO active_sessions (userid, last_route) VALUES ($1, '/staffSchedule') RETURNING login_id",
        [user.userid]
      );
      loginId = newSessionRes.rows[0].login_id;
    }

    const token = jwt.sign(
      { 
        id: user.userid, 
        role: user.role, 
        staffRole: staff.role, // For ProtectedRoute check
        specializations: staff.role, 
        branchid: staff.branchid,
        login_id: loginId 
      },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

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
        specializations: staff.role,
        branchid: staff.branchid
      },
    };
  }
}
