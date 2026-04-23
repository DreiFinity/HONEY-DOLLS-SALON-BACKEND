// src/interfaces/controllers/Staff/StaffController.js
import RegisterStaff from "../../../application/usecases/Register/RegisterStaff.js";
import DeleteStaff from "../../../application/usecases/Staff/DeleteStaff.js";
import EditStaff from "../../../application/usecases/Staff/EditStaff.js";
import GetAllStaff from "../../../application/usecases/Staff/GetAllStaff.js";
import bcrypt from "bcryptjs";

export default class StaffController {
  constructor(staffRepository, userRepository) {
    this.staffRepository = staffRepository;
    this.userRepository = userRepository;
  }

  async getAll(req, res) {
    try {
      const useCase = new GetAllStaff(this.userRepository);
      const staff = await useCase.execute();
      return res.json({ staff });
    } catch (err) {
      console.error("StaffController error:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      // Data from request
      const { username, email, password, firstname, lastname, contact, branchid, image, role } = req.body;
      
      const useCase = new RegisterStaff(this.userRepository);
      const result = await useCase.execute({
        username,
        email,
        password,
        firstname,
        lastname,
        contact,
        branchid: branchid || null,
        image,
        role
      });
      
      return res.status(201).json(result);
    } catch (err) {
      console.error("StaffController error:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const useCase = new DeleteStaff(this.userRepository);
      await useCase.execute(id);
      return res.json({ message: "Staff deleted successfully" });
    } catch (err) {
      console.error("StaffController error:", err);
      return res.status(500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const useCase = new EditStaff(this.userRepository);
      const updatedStaff = await useCase.execute(id, req.body);
      return res.json(updatedStaff);
    } catch (err) {
      console.error("StaffController error:", err);
      return res.status(500).json({ message: err.message });
    }
  }
}
