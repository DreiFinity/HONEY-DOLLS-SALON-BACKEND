// src/application/usecases/Branch/GetAllTransfers.js
export default class GetAllTransfers {
  constructor(productTransferRepo) {
    this.productTransferRepo = productTransferRepo;
  }

  async execute() {
    return await this.productTransferRepo.getAllTransfers();
  }
}
