export default class UpdateSupplier {
  constructor(supplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  async execute(id, data) {
    if (!id) {
      throw new Error("Supplier ID is required.");
    }
    const updated = await this.supplierRepository.update(id, data);
    if (!updated) {
      throw new Error("Supplier not found or could not be updated.");
    }
    return updated;
  }
}
