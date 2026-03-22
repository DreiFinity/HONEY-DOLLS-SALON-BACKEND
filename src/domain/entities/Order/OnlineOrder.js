class OnlineOrder {
  constructor({
    orderid,
    customerid,
    order_channel = "online",
    status = "pending",

    createdat = new Date(),
  }) {
    this.orderid = orderid;
    this.customerid = customerid;
    this.order_channel = order_channel;
    this.status = status;
    this.createdat = createdat;
  }
}

module.exports = OnlineOrder;
