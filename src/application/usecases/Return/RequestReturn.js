export default class RequestReturn {
  constructor(returnRepository) {
    this.returnRepository = returnRepository;
  }

  async execute(returnData) {
    // Basic validation
    if (!returnData.orderid || !returnData.productid || !returnData.quantity) {
      throw new Error("Missing required fields for return request");
    }

    if (returnData.quantity <= 0) {
      throw new Error("Quantity must be greater than zero");
    }

    return await this.returnRepository.createReturnRequest(returnData);
  }

  async updateStatus(returnid, status) {
    return await this.returnRepository.updateReturnStatus(returnid, status);
  }

  async processReturnRefund(returnid, refundProof) {
    return await this.returnRepository.processReturnRefund(returnid, refundProof);
  }
}
