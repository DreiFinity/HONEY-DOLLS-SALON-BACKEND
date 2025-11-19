import { LoginUser } from "../../application/usecases/Login/LoginUser.js";
import { UserRepositoryImpl } from "../../infrastructure/repositories/Login/UserRepositoryImpl.js";
import { BcryptService } from "../../infrastructure/security/BcryptService.js";

export class UserController {
  static async login(req, res) {
    try {
      const repo = new UserRepositoryImpl();
      const hashService = new BcryptService();
      const login = new LoginUser(repo, hashService);
      const result = await login.execute(req.body);
      res.status(200).json(result);
    } catch (err) {
      res.status(401).json({ error: err.message });
    }
  }
}
