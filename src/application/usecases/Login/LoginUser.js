import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";
import { v4 as uuidv4 } from "uuid";
import db from "../../../infrastructure/db/index.js";

export default class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password, requiredRole }) {
    console.log("LOGIN ATTEMPT:", { email, password, requiredRole });

    const user = await this.userRepository.findByEmail(email);
    console.log("USER FOUND:", user);

    if (!user) throw new Error("Invalid credentials");

    console.log("DB HASH:", user.password);

    const match = await bcrypt.compare(password, user.password);
    console.log("PASSWORD MATCH:", match);

    if (!match) throw new Error("Invalid credentials");

    console.log("ROLE CHECK:", user.role, "required:", requiredRole);

    // 4️⃣ Single-session logic
    let activeSession = await db.getActiveSession(user.userid); // use correct user id
    let loginId;

    if (activeSession) {
      loginId = activeSession.login_id; // reuse existing session
    } else {
      loginId = uuidv4();
      await db.createOrUpdateActiveSession(user.userid, loginId, "/dashboard");
    }

    if (
      requiredRole &&
      user.role?.trim().toLowerCase() !== requiredRole.toLowerCase()
    ) {
      throw new Error("Forbidden role");
    }

    const token = jwt.sign(
      { id: user.userid, role: user.role, login_id: loginId },
      config.jwtSecret,
      { expiresIn: "24h" },
    );

    return {
      token,
      user: {
        userid: user.userid,
        username: user.username,
        email: user.email,
        role: user.role,
        isactive: user.isactive,
      },
      last_route: activeSession ? activeSession.last_route : "/dashboard",
    };
  }
}
