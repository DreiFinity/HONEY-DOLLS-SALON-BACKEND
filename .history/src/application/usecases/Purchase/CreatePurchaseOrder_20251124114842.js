export default class CreatePurchaseOrder {
  constructor(purchaseOrderRepository) {
    this.purchaseOrderRepository = purchaseOrderRepository;
  }

  async execute(data) {
    return await this.purchaseOrderRepository.create(data);
  }
}
