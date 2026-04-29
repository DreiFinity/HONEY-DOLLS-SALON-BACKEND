// src/application/usecases/Branch/ConfirmTransferArrival.js
export default class ConfirmTransferArrival {
  constructor(productTransferRepository) {
    this.productTransferRepository = productTransferRepository;
  }

  async execute(transferid) {
    return await this.productTransferRepository.updateStatus(transferid, 'ARRIVED');
  }
}
