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
    // Check if email already exists
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new Error("Email already exists");

    // Insert into users table
    const newUser = await this.userRepository.createUser({
      username,
      email,
      password, // plain for testing
      role: role || "user",
    });

    // Insert into customers table
    const newCustomer = await this.userRepository.createCustomer({
      firstname,
      lastname,
      contact,
      userid: newUser.userid,
    });

    return { user: newUser, customer: newCustomer };
  }
}
