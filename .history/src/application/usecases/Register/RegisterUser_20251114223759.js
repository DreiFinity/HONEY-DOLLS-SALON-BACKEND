export class RegisterUser {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ username, email, password, role }) {
    // Check if email already exists
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error("Email already exists");
    }

    // TEMPORARY: store plain password for testing
    // (DO NOT USE IN PRODUCTION)
    const newUser = await this.userRepository.create({
      username,
      email,
      password, // plain
      role: role || "user",
    });

    return newUser;
  }
}
