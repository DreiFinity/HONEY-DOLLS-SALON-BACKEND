import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";

export default class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password, requiredRole }) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await this.userRepository.comparePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    if (!user.isactive) {
      throw new Error("Account is inactive");
    }

    // Check for existing active session
    const activeSession = await this.userRepository.getActiveSession(user.userid);

    let loginId = null;
    if (activeSession) {
      loginId = activeSession.login_id;
    } else {
      // Register new login session
      const newSession = await this.userRepository.registerLogin(user.userid);
      loginId = newSession.login_id;
    }

    if (
      requiredRole &&
      user.role?.trim().toLowerCase() !== requiredRole.toLowerCase()
    ) {
      throw new Error("Forbidden role");
    }

    let staffRole = null;
    let branchid = null;
    const normalizedRole = user.role?.trim().toLowerCase();
    if (normalizedRole === "staff") {
      const staff = await this.userRepository.findStaffByUserId(user.userid);
      staffRole = staff?.role;
      branchid = staff?.branchid;
    }

    const token = jwt.sign(
      { 
        id: user.userid, 
        role: user.role, 
        staffRole, 
        specializations: staffRole, // Compatibility for receptionist check
        branchid, 
        login_id: loginId 
      },
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
        branchid: branchid,
        specializations: staffRole,
      },
      last_route: activeSession ? activeSession.last_route : "/dashboard",
    };
  }
}
