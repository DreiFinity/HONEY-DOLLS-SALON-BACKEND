export default class CreateSupplier {
  constructor(supplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  async execute(data) {
    // Validate required fields if necessary
    if (!data.suppliername) {
      throw new Error("Supplier name is required.");
    }
    return await this.supplierRepository.create(data);
  }
}
