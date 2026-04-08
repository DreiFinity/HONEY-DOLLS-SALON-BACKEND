export default class InventoryController {
  constructor(inventoryRepository) {
    this.inventoryRepository = inventoryRepository;
  }

  async getByBranch(req, res) {
    try {
      const { branchid } = req.params;
      const data = await this.inventoryRepository.getBranchInventory(branchid);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const data = await this.inventoryRepository.getTotalInventory();
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
