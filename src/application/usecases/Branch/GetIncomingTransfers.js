// src/application/usecases/Branch/GetIncomingTransfers.js
export default class GetIncomingTransfers {
  constructor(productTransferRepository) {
    this.productTransferRepository = productTransferRepository;
  }

  async execute(branchid) {
    return await this.productTransferRepository.getTransfersByBranch(branchid);
  }
}
