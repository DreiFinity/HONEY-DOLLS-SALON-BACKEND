export default class DeleteCustomerAddress {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(addressId, customerId) {
    const address = await this.repository.findById(addressId);

    if (!address) {
      throw new Error("Address not found");
    }

    if (address.customerid !== customerId) {
      throw new Error("Unauthorized");
    }

    if (address.is_default) {
      throw new Error("Default address cannot be deleted");
    }

    const deleted = await this.repository.delete(addressId, customerId);

    return deleted;
  }
}
