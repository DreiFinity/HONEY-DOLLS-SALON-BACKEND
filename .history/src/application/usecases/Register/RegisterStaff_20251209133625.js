export default class RegisterStaff {
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
      role: "staff",
    });

    const staff = await this.userRepository.createStaff({
      firstname,
      lastname,
      contact,
      branchid,
      userid: user.userid,
      image, // <-- pass image to repository
    });

    return { user, staff };
  }
}