import jwt from "jsonwebtoken";
import { config } from "../../config/env.js";

export class LoginUser {
  constructor(userRepository, hashService) {
    this.userRepository = userRepository;
    this.hashService = hashService;
  }

  async execute({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    const match = await this.hashService.compare(password, user.password);
    if (!match) throw new Error("Invalid email or password");

    const token = jwt.sign(
      { id: user.userid, role: user.role },
      config.jwtSecret,
      { expiresIn: "1h" }
    );

    return { token, user };
  }
}
