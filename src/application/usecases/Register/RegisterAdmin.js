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
    branchid,
    image, // <-- add image
  }) {
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
      branchid,
      userid: user.userid,
      image, // <-- pass image to repository
    });

    return { user, admin };
  }
}