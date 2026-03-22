export default class CustomerAddress {
  constructor({
    customerid,
    street,
    barangay,
    city,
    province,
    postal_code,
    is_default,
  }) {
    this.customerid = customerid;
    this.street = street;
    this.barangay = barangay;
    this.city = city;
    this.province = province;
    this.postal_code = postal_code;
    this.is_default = is_default || false;
  }
}
