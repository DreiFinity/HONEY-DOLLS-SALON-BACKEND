import bcrypt from "bcryptjs";

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
    image, 
  }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.createUser({
      username,
      email,
      password: hashedPassword,
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