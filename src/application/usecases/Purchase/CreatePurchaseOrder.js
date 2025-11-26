export default class CreatePurchaseOrder {
  constructor(purchaseOrderRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(orderData, items) {
    // Must call createPurchaseWithDetails (not create)
    return await this.purchaseOrderRepository.createPurchaseWithDetails(
      orderData,
      items
    );
  }
}
