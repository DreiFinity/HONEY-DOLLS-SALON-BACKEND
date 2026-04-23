export default class CustomerAdminController {
  constructor(getAllCustomers) {
    this.getAllCustomers = getAllCustomers;
  }

  getAllCustomersHandler = async (req, res) => {
    try {
      const customers = await this.getAllCustomers.execute();
      res.json({ success: true, customers });
    } catch (err) {
      console.error("Error fetching customers:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
