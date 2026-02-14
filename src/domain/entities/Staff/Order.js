// src/domain/entities/Order.js
export class Order {
  constructor({ customerid, total_amount }) {
    this.customerid = customerid;
    this.total_amount = total_amount;
  }
}