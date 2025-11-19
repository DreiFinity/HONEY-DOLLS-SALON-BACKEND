import { RegisterUser } from "../../../application/usecases/Register/RegisterUser.js";

export class RegisterController {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  register = async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      const usecase = new RegisterUser(this.userRepository);
      const user = await usecase.execute({ username, email, password, role });

      return res.status(201).json({
        message: "User registered successfully",
        user,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  };
}
