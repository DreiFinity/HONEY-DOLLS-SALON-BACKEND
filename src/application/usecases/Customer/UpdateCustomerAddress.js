export default class UpdateCustomerAddress {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(addressId, customerId, data) {
    // 1️⃣ Find the address to update
    const address = await this.repository.findById(addressId);
    if (!address) throw new Error("Address not found");
    if (address.customerid !== customerId) throw new Error("Unauthorized");

    // 2️⃣ If updating to default, unset other defaults
    if (data.is_default) {
      const otherDefaults =
        await this.repository.findDefaultByCustomer(customerId);
      for (const other of otherDefaults) {
        if (other.addressid !== addressId) {
          await this.repository.update(other.addressid, customerId, {
            ...other, // include current fields
            is_default: false,
          });
        }
      }
    }

    // 3️⃣ Merge existing values with new data to avoid nulls
    const updatedData = {
      street: data.street ?? address.street,
      barangay: data.barangay ?? address.barangay,
      city: data.city ?? address.city,
      province: data.province ?? address.province,
      postal_code: data.postal_code ?? address.postal_code,
      is_default: data.is_default ?? address.is_default,
    };

    // 4️⃣ Update the selected address
    const updated = await this.repository.update(
      addressId,
      customerId,
      updatedData,
    );

    return updated;
  }
}
