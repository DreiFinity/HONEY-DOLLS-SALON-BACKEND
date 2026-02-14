export default class RegisterCustomer {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute({ username, email, password, firstname, lastname, contact }) {
    const user = await this.userRepository.createUser({
      username,
      email,
      password,
      role: "customer",
    });

    const customer = await this.userRepository.createCustomer({
      firstname,
      lastname,
      contact,
      userid: user.userid,
    });

    return { user, customer };
  }
}
