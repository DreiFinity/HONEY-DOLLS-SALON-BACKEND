// src/domain/entities/OrderDetail.js
export class OrderDetail {
  constructor({ serviceid, productid, quantity, unit_price }) {
    this.serviceid = serviceid || null;
    this.productid = productid || null;
    this.quantity = quantity;
    this.unit_price = unit_price;
  }
}