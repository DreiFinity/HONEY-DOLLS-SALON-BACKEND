export default class CancelOrder {
  constructor(repository) {
    this.repository = repository;
  }

  async execute(orderid, customerid) {
    return await this.repository.cancelOrder(orderid, customerid);
  }
}
