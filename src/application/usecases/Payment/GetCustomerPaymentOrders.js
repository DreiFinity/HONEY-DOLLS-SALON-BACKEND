export default class GetCustomerPaymentOrders {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Get all payment orders (admin view)
   */
  async getAll() {
    return await this.repository.getAllPaymentOrders();
  }

  /**
   * Get a single payment order by its ID with full order details
   */
  async getById(customerpaymentid) {
    if (!customerpaymentid) {
      throw new Error("Payment ID is required");
    }
    const payment =
      await this.repository.getPaymentOrderById(customerpaymentid);
    if (!payment) {
      throw new Error(
        `Payment with ID ${customerpaymentid} not found`,
      );
    }
    return payment;
  }

  /**
   * Get all payment orders for a specific customer
   */
  async getByCustomerId(customerid) {
    if (!customerid) {
      throw new Error("Customer ID is required");
    }
    return await this.repository.getPaymentOrdersByCustomerId(customerid);
  }

  /**
   * Get payment orders filtered by status (pending, paid, etc.)
   */
  async getByStatus(status) {
    if (!status) {
      throw new Error("Status is required");
    }
    const validStatuses = ["pending", "paid", "failed", "cancelled"];
    if (!validStatuses.includes(status.toLowerCase())) {
      throw new Error(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      );
    }
    return await this.repository.getPaymentOrdersByStatus(
      status.toLowerCase(),
    );
  }

  /**
   * Update tracking number for a payment's orders.
   * Sets shipped_at + status = 'shipping' on all linked orders.
   */
  async updateTracking(customerpaymentid, tracking_number, courier_name) {
    if (!customerpaymentid) {
      throw new Error("Payment ID is required");
    }
    if (!tracking_number || !tracking_number.trim()) {
      throw new Error("Tracking number is required");
    }
    if (!courier_name || !courier_name.trim()) {
      throw new Error("Courier name is required");
    }
    return await this.repository.updateTrackingNumber(
      customerpaymentid,
      tracking_number.trim(),
      courier_name.trim(),
    );
  }

  /**
   * Mark all orders linked to a payment as delivered.
   * Sets delivered_at + status = 'delivered'.
   */
  async markDelivered(customerpaymentid) {
    if (!customerpaymentid) {
      throw new Error("Payment ID is required");
    }
    return await this.repository.markOrdersDelivered(customerpaymentid);
  }

  /**
   * Upload refund proof for a cancelled payment.
   */
  async uploadRefundProof(customerpaymentid, filename) {
    if (!customerpaymentid) {
      throw new Error("Payment ID is required");
    }
    if (!filename) {
      throw new Error("Refund proof filename is required");
    }
    return await this.repository.uploadRefundProof(customerpaymentid, filename);
  }
}
