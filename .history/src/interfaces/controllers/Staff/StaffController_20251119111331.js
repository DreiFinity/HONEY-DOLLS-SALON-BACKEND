// src/interfaces/controllers/Staff/StaffController.js
export default class StaffController {
  constructor(staffRepository) {
    this.staffRepository = staffRepository;
  }

  async getAll(req, res) {
    try {
      const staff = await this.staffRepository.getAllStaff();
      return res.json({ staff });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}
