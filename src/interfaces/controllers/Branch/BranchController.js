// src/interfaces/controllers/Branch/BranchController.js
export default class BranchController {
  constructor(branchRepository) {
    this.branchRepository = branchRepository;
  }

  async getAll(req, res) {
    try {
      const branches = await this.branchRepository.getAllBranches();
      return res.json({ success: true, data: branches }); // updated payload to match standards
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async create(req, res) {
    try {
      if (!req.body.branchname || !req.body.location) {
        return res.status(400).json({ success: false, error: "Branch name and location are required." });
      }
      const branch = await this.branchRepository.create(req.body);
      return res.status(201).json({ success: true, data: branch });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const branch = await this.branchRepository.update(id, req.body);
      if (!branch) {
        return res.status(404).json({ success: false, error: "Branch not found" });
      }
      return res.json({ success: true, data: branch });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const success = await this.branchRepository.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, error: "Branch not found" });
      }
      return res.json({ success: true, message: "Branch deleted successfully" });
    } catch (err) {
      // Typically fails if there are foreign key constraints from users, products, etc.
      return res.status(400).json({ success: false, error: "Cannot delete branch. It may be in use by other records." });
    }
  }
}
