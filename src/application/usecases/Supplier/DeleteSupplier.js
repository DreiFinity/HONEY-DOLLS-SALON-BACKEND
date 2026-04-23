export default class DeleteSupplier {
  constructor(supplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  async execute(id) {
    if (!id) {
      throw new Error("Supplier ID is required.");
    }
    const success = await this.supplierRepository.delete(id);
    if (!success) {
      throw new Error("Supplier not found or already deleted.");
    }
    return success;
  }
}
