export default class SupplierController {
  constructor(getAllSuppliers, createSupplier, updateSupplier, deleteSupplier) {
    this.getAllSuppliers = getAllSuppliers;
    this.createSupplier = createSupplier;
    this.updateSupplier = updateSupplier;
    this.deleteSupplier = deleteSupplier;
  }

  getAllHandler = async (req, res) => {
    try {
      const suppliers = await this.getAllSuppliers.execute();
      res.json({ success: true, data: suppliers });
    } catch (err) {
      console.error("Error getting suppliers:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

  createHandler = async (req, res) => {
    try {
      const supplier = await this.createSupplier.execute(req.body);
      res.status(201).json({ success: true, data: supplier });
    } catch (err) {
      console.error("Error creating supplier:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  };

  updateHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const supplier = await this.updateSupplier.execute(id, req.body);
      res.json({ success: true, data: supplier });
    } catch (err) {
      console.error("Error updating supplier:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  };

  deleteHandler = async (req, res) => {
    try {
      const { id } = req.params;
      await this.deleteSupplier.execute(id);
      res.json({ success: true, message: "Supplier deleted successfully" });
    } catch (err) {
      console.error("Error deleting supplier:", err);
      res.status(400).json({ success: false, error: err.message });
    }
  };
}
