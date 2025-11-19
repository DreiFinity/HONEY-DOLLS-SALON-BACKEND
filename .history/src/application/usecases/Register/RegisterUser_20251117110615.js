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
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error("Email already exists");

    const user = await this.userRepository.createUser({
      username,
      email,
      password,
      role: role || "user",
    });

    await this.userRepository.createCustomer({
      firstname,
      lastname,
      contact,
      userid: user.userid,
    });

    const loginUsecase = new LoginUser(this.userRepository);
    const { token } = await loginUsecase.execute({ email, password });

    return { user, token };
  }
}
