export default class CreateCustomerAddress {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(data) {
    if (!data.street || !data.city || !data.province) {
      throw new Error("Street, city and province are required");
    }

    return await this.repository.create(data);
  }
}
