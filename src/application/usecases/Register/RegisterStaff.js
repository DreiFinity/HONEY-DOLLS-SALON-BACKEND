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
    role,
  }) {
    // 1. Check for existing email
    const existingEmail = await this.userRepository.findByEmail(email);
    if (existingEmail) {
      throw new Error("This email is already registered to another account.");
    }

    // 2. Check for existing username (optional but recommended)
    const existingUsername = await this.userRepository.findByUsername(username);
    if (existingUsername) {
      throw new Error("This username is already taken.");
    }

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
      image,
      role,
    });

    return { user, staff };
  }
}