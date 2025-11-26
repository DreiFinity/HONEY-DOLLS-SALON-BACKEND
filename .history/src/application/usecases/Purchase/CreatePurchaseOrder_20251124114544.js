export default class CreatePurchaseOrder {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(orderData, items) {
    return await this.repository.createPurchaseWithDetails(orderData, items);
  }
}
