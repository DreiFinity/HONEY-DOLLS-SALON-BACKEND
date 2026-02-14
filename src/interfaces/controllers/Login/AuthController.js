// src/interfaces/controllers/AuthController.js
export default class AuthController {
  constructor(
    registerCustomer,
    registerStaff,
    registerAdmin,
    loginUser,
    getAllStaff,
    editStaff,
    deleteStaff
  ) {
    this.registerCustomer = registerCustomer;
    this.registerStaff = registerStaff;
    this.registerAdmin = registerAdmin;
    this.loginUser = loginUser;
    this.getAllStaff = getAllStaff;
    this.editStaff = editStaff;
    this.deleteStaff = deleteStaff;
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
      const payload = { ...req.body, image: req.file?.filename };
      const result = await this.registerStaff.execute(payload);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  registerAdminHandler = async (req, res) => {
    try {
      const payload = { ...req.body, image: req.file?.filename };
      const result = await this.registerAdmin.execute(payload);
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
  fetchStaffHandler = async (req, res) => {
    try {
      const staff = await this.getAllStaff.execute();
      res.json(staff);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  editStaffHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const staffData = req.body;
      if (req.file) staffData.image = `/uploads/${req.file.filename}`;
      const updated = await this.editStaff.execute(id, staffData);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  deleteStaffHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.deleteStaff.execute(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}
