export default class CreateSupplierPurchase {
  constructor(supplierPurchaseRepository) {
    this.supplierPurchaseRepository = supplierPurchaseRepository;
  }

  async execute(purchaseData, items) {
    if (!purchaseData.supplierid) throw new Error("Supplier ID is required");
    if (!items || items.length === 0) throw new Error("At least one purchase item is required");

    // Standard business logic: check item quantities
    for (const item of items) {
      if (!item.productid || item.quantity <= 0) {
        throw new Error("Invalid product details");
      }
    }

    return await this.supplierPurchaseRepository.create(purchaseData, items);
  }
}
