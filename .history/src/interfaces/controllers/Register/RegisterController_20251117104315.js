import { RegisterUser } from "../../../application/usecases/Register/RegisterUser.js";

export class RegisterController {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  register = async (req, res) => {
    try {
      const { username, email, password, role, firstname, lastname, contact } =
        req.body;

      const usecase = new RegisterUser(this.userRepository);
      const { user, token } = await usecase.execute({
        username,
        email,
        password,
        role,
        firstname,
        lastname,
        contact,
      });

      return res.status(201).json({
        message: "User registered successfully",
        user,
        token, // JWT returned directly
      });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  };
}
