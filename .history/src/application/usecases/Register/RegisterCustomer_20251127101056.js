import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";

export default class RegisterCustomer {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ username, email, password, firstname, lastname, contact }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error("Email already registered");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB
    const user = await this.userRepository.createUser({
      username,
      email,
      password: hashedPassword,
      role: "customer",
    });

    // Create customer in DB
    const customer = await this.userRepository.createCustomer({
      firstname,
      lastname,
      contact,
      userid: user.userid,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.userid, role: user.role },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

    // Return user + customer + token
    return { token, user, customer };
  }
}
