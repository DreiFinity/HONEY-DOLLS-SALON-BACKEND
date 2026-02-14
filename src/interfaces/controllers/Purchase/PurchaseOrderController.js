export default class PurchaseOrderController {
  constructor(createPurchaseOrderUseCase) {
    this.createPurchaseOrderUseCase = createPurchaseOrderUseCase;
  }

  async create(req, res) {
    try {
      const { purchaseid, supplierid, status, branchid, items } = req.body;

      // Call the usecase
      const result = await this.createPurchaseOrderUseCase.execute(
        { purchaseid, supplierid, status, branchid },
        items
      );

      return res.status(201).json({
        message: "Purchase created successfully",
        ...result,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        message: "Failed to create purchase",
        error: err.message,
      });
    }
  }
}
