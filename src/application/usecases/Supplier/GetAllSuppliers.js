export default class GetAllSuppliers {
  constructor(supplierRepository) {
    this.supplierRepository = supplierRepository;
  }

  async execute() {
    return await this.supplierRepository.getAll();
  }
}
