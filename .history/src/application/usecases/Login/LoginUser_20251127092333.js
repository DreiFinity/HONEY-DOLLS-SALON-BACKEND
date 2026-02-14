import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";

export class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password, requiredRole }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    if (user.password !== password) {
      throw new Error("Invalid email or password");
    }

    if (requiredRole && user.role !== requiredRole) {
      throw new Error(`Forbidden: User must be a ${requiredRole}`);
    }

    const token = jwt.sign(
      { id: user.userid, role: user.role },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

    return { token, user };
  }
}
