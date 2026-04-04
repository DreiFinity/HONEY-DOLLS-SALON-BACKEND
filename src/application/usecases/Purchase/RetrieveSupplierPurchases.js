export class GetAllSupplierPurchases {
  constructor(supplierPurchaseRepository) {
    this.supplierPurchaseRepository = supplierPurchaseRepository;
  }

  async execute() {
    return await this.supplierPurchaseRepository.findAll();
  }
}

export class GetSupplierPurchaseById {
   constructor(supplierPurchaseRepository) {
     this.supplierPurchaseRepository = supplierPurchaseRepository;
   }

   async execute(id) {
     return await this.supplierPurchaseRepository.findById(id);
   }
}
