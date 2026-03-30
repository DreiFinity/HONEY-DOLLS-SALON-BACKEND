// src/interfaces/controllers/Branch/BranchController.js
export default class BranchController {
  constructor(branchRepository) {
    this.branchRepository = branchRepository;
  }

  async getAll(req, res) {
    try {
      const branches = await this.branchRepository.getAllBranches();
      return res.json({ branches });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}
