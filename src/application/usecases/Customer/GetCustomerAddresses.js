  export default class GetCustomerAddresses {
    constructor(repository) {
      this.repository = repository;
    }

    async execute(customerid) {
      return await this.repository.findByCustomer(customerid);
    }
  }
