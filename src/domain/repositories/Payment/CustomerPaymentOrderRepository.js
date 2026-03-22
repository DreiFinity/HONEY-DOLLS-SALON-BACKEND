// Domain interface for CustomerPaymentOrder queries
export default class CustomerPaymentOrderRepository {
  async getAllPaymentOrders() {
    throw new Error("Method not implemented");
  }

  async getPaymentOrderById(customerpaymentid) {
    throw new Error("Method not implemented");
  }

  async getPaymentOrdersByCustomerId(customerid) {
    throw new Error("Method not implemented");
  }

  async getPaymentOrdersByStatus(status) {
    throw new Error("Method not implemented");
  }

  async updateTrackingNumber(customerpaymentid, tracking_number) {
    throw new Error("Method not implemented");
  }

  async markOrdersDelivered(customerpaymentid) {
    throw new Error("Method not implemented");
  }
}
