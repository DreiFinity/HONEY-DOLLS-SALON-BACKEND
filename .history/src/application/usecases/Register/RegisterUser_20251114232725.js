export class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ username, email, password, role }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error("Email already exists");

    const newUser = await this.userRepository.create({
      username,
      email,
      password, // plain for testing
      role: role || "user",
    });

    return newUser;
  }
}
