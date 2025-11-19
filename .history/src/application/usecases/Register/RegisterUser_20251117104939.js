import { LoginUser } from "../../../application/usecases/Login/LoginUser.js";

export class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({
    username,
    email,
    password,
    role,
    firstname,
    lastname,
    contact,
  }) {
    // Check if user exists
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error("Email already exists");

    // Create user
    const user = await this.userRepository.createUser({
      username,
      email,
      password, // plain for now, or hash if using Bcrypt
      role: role || "user",
    });

    // Create customer linked to user
    await this.userRepository.createCustomer({
      firstname,
      lastname,
      contact,
      userid: user.userid,
    });

    // Generate JWT token (auto-login)
    const loginUsecase = new LoginUser(this.userRepository);
    const { token } = await loginUsecase.execute({ email, password });

    return { user, token };
  }
}
