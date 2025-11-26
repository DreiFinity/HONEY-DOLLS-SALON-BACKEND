export default class PurchaseOrderController {
  constructor(createPurchaseOrder) {
    this.createPurchaseOrder = createPurchaseOrder;
  }

  async create(req, res) {
    try {
      const { purchaseid, supplierid, status, branchid, items } = req.body;

      const result = await this.createPurchaseOrder.execute(
        { purchaseid, supplierid, status, branchid },
        items
      );

      return res.status(201).json({
        message: "Purchase created successfully",
        ...result,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to create purchase",
        error: error.message,
      });
    }
  }
}
