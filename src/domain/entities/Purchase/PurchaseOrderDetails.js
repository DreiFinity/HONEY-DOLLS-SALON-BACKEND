export default class PurchaseOrderDetails {
  constructor({ purchasedetailid, purchaseid, productid, unit_price, quantity }) {
    this.purchasedetailid = purchasedetailid;
    this.purchaseid = purchaseid;
    this.productid = productid;
    this.unit_price = unit_price;
    this.quantity = quantity;
  }
}
