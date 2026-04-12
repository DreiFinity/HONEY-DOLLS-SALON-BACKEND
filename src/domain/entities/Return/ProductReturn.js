export default class ProductReturn {
  constructor(
    returnid,
    orderid,
    customerid,
    productid,
    quantity,
    reason,
    reason_type = "others",
    status = "pending",
    customer_evidence_image = null,
    refund_proof = null,
    refund_at = null,
    createdat = new Date(),
    updatedat = new Date()
  ) {
    this.returnid = returnid;
    this.orderid = orderid;
    this.customerid = customerid;
    this.productid = productid;
    this.quantity = quantity;
    this.reason = reason;
    this.reason_type = reason_type;
    this.status = status;
    this.customer_evidence_image = customer_evidence_image;
    this.refund_proof = refund_proof;
    this.refund_at = refund_at;
    this.createdat = createdat;
    this.updatedat = updatedat;
  }
}
