export default class GetCustomerReturns {
  constructor(returnRepository) {
    this.returnRepository = returnRepository;
  }

  async execute(customerid) {
    return await this.returnRepository.getReturnsByCustomer(customerid);
  }
}
