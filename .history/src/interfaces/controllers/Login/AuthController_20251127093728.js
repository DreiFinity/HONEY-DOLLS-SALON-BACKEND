// src/interfaces/controllers/AuthController.js
export default class AuthController {
  constructor(registerCustomer, registerStaff, registerAdmin, loginUser) {
    this.registerCustomer = registerCustomer;
    this.registerStaff = registerStaff;
    this.registerAdmin = registerAdmin;
    this.loginUser = loginUser;
  }

  registerCustomerHandler = async (req, res) => {
    try {
      const result = await this.registerCustomer.execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  registerStaffHandler = async (req, res) => {
    try {
      const result = await this.registerStaff.execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  registerAdminHandler = async (req, res) => {
    try {
      const result = await this.registerAdmin.execute(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  loginCustomerHandler = async (req, res) => {
    try {
      const result = await this.loginUser.execute({
        ...req.body,
        requiredRole: "customer",
      });
      res.json(result);
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  };

  loginStaffHandler = async (req, res) => {
    try {
      const result = await this.loginUser.execute({
        ...req.body,
        requiredRole: "staff",
      });
      res.json(result);
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  };

  loginAdminHandler = async (req, res) => {
    try {
      const result = await this.loginUser.execute({
        ...req.body,
        requiredRole: "admin",
      });
      res.json(result);
    } catch (err) {
      res.status(403).json({ error: err.message });
    }
  };
}
