import { LoginStaff } from "../../../application/usecases/Staff/LoginStaff.js";
import { pool } from "../../../infrastructure/db/index.js";

<<<<<<< HEAD
const loginStaff = new LoginStaff(pool);   // ← pass pool directly
=======
const loginStaff = new LoginStaff(pool); // ← pass pool directly
>>>>>>> 7f081c6e6b172bd213ccfd24194f1405617332c5

export class StaffController {
  static async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }
      const result = await loginStaff.execute({ email, password });
      res.json(result);
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 7f081c6e6b172bd213ccfd24194f1405617332c5
