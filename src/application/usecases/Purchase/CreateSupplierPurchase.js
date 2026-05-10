export default class CreateSupplierPurchase {
  constructor(supplierPurchaseRepository) {
    this.supplierPurchaseRepository = supplierPurchaseRepository;
  }

  generateReferenceCode() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `REF-${timestamp}-${random}`;
  }

  async execute(purchaseData, items, paymentTerms) {
    if (!purchaseData.supplierid) throw new Error("Supplier ID is required");
    if (!items || items.length === 0) throw new Error("At least one purchase item is required");

    // Generate reference code if not provided
    if (!purchaseData.reference_code) {
      purchaseData.reference_code = this.generateReferenceCode();
    }

    // Standard business logic: check item quantities
    for (const item of items) {
      if (!item.productid || item.quantity <= 0) {
        throw new Error("Invalid product details");
      }
    }

    return await this.supplierPurchaseRepository.create(purchaseData, items, paymentTerms);
  }
}
