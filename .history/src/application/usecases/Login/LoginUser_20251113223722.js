import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";

export class LoginUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
    // no hashService needed for plain passwords
  }

  async execute({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    // TEMPORARY: plain password comparison
    if (user.password !== password) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
      { id: user.userid, role: user.role },
      config.jwtSecret,
      { expiresIn: "1h" }
    );

    return { token, user };
  }
}
