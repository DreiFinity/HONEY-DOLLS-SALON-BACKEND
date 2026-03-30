import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../../../config/env.js";
import { v4 as uuidv4 } from "uuid";
import db from "../../../infrastructure/db/index.js";

export default class RegisterCustomer {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({
    username,
    email,
    password,
    firstname,
    lastname,
    contact,
    street,
    barangay,
    city,
    province,
    postal_code,
  }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.createUser({
      username,
      email,
      password: hashedPassword,
      role: "customer",
    });

    const customer = await this.userRepository.createCustomer({
      firstname,
      lastname,
      contact,
      userid: user.userid,
      street,
      barangay,
      city,
      province,
      postal_code,
    });

    const loginId = uuidv4();
    await db.createOrUpdateActiveSession(user.userid, loginId, "/dashboard");

    const token = jwt.sign(
      { id: user.userid, role: user.role, login_id: loginId },
      config.jwtSecret,
      { expiresIn: "24h" },
    );

    return { token, user, customer };
  }
}
