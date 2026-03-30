export default class RegisterAdmin {
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
    image, // <-- add image
  }) {
    // Check if an admin already exists
    const adminExists = await this.userRepository.findByRole("admin");
    if (adminExists && adminExists.length > 0) {
      throw new Error("An admin already exists. Only one admin is allowed.");
    }

    const user = await this.userRepository.createUser({
      username,
      email,
      password,
      role: "admin",
    });

    const admin = await this.userRepository.createAdmin({
      firstname,
      lastname,
      contact,
      userid: user.userid,
      image, // <-- pass image to repository
    });

    return { user, admin };
  }
}