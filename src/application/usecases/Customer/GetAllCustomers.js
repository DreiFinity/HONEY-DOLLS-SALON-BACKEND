export default class GetAllCustomers {
  constructor(customerRepository) {
    this.customerRepository = customerRepository;
  }

  async execute() {
    return await this.customerRepository.getAllCustomers();
  }
}
