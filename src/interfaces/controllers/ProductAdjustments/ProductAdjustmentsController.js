// src/interfaces/controllers/ProductAdjustments/ProductAdjustmentsController.js
export default class ProductAdjustmentsController {
  constructor(productAdjustmentsRepository) {
    this.repo = productAdjustmentsRepository;
  }

  // GET /api/product-adjustments
  async getAll(req, res) {
    try {
      const records = await this.repo.getAll();
      return res.json({ records });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // POST /api/product-adjustments/waste
  async createWaste(req, res) {
    try {
      const { productid, userid, quantity, reason, remarks, branchid } = req.body;
      if (!productid || !userid || !reason || !quantity) {
        return res.status(400).json({ message: "productid, userid, quantity, and reason are required." });
      }
      const record = await this.repo.createWaste({ productid, userid, quantity: parseInt(quantity), reason, remarks, branchid });
      return res.status(201).json({ message: "Waste record created.", record });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // DELETE /api/product-adjustments/waste/:id
  async deleteWaste(req, res) {
    try {
      await this.repo.deleteWaste(parseInt(req.params.id));
      return res.json({ message: "Waste record deleted." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // POST /api/product-adjustments/usage
  async createUsage(req, res) {
    try {
      const { productid, userid, quantity, reason, remarks, branchid } = req.body;
      if (!productid || !userid || !quantity) {
        return res.status(400).json({ message: "productid, userid, and quantity are required." });
      }
      const record = await this.repo.createUsage({
        productid,
        userid,
        quantity: parseInt(quantity),
        reason,
        remarks,
        branchid
      });
      return res.status(201).json({ message: "Usage record created.", record });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // DELETE /api/product-adjustments/usage/:id
  async deleteUsage(req, res) {
    try {
      await this.repo.deleteUsage(parseInt(req.params.id));
      return res.json({ message: "Usage record deleted." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // POST /api/product-adjustments/damage
  async createDamage(req, res) {
    try {
      const { productid, userid, quantity, reason, remarks, branchid } = req.body;
      if (!productid || !userid || !reason || !quantity) {
        return res.status(400).json({ message: "productid, userid, quantity, and reason are required." });
      }
      const record = await this.repo.createDamage({ productid, userid, quantity: parseInt(quantity), reason, remarks, branchid });
      return res.status(201).json({ message: "Damage record created.", record });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  // DELETE /api/product-adjustments/damage/:id
  async deleteDamage(req, res) {
    try {
      await this.repo.deleteDamage(parseInt(req.params.id));
      return res.json({ message: "Damage record deleted." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }
}
