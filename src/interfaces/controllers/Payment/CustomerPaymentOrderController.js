export default class CustomerPaymentOrderController {
  constructor(getCustomerPaymentOrdersUseCase) {
    this.getCustomerPaymentOrdersUseCase = getCustomerPaymentOrdersUseCase;
  }

  /**
   * GET /api/customer-payment-orders
   * Returns all payment orders (admin view)
   */
  async getAll(req, res) {
    try {
      const payments = await this.getCustomerPaymentOrdersUseCase.getAll();
      res.json({ success: true, data: payments });
    } catch (err) {
      console.error("Error fetching all payment orders:", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/customer-payment-orders/:id
   * Returns a single payment order with full nested details
   */
  async getById(req, res) {
    try {
      const { id } = req.params;
      const payment =
        await this.getCustomerPaymentOrdersUseCase.getById(Number(id));
      res.json({ success: true, data: payment });
    } catch (err) {
      console.error("Error fetching payment order:", err.message);
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/customer-payment-orders/customer/:customerid
   * Returns all payment orders for a specific customer
   */
  async getByCustomerId(req, res) {
    try {
      const { customerid } = req.params;
      const payments =
        await this.getCustomerPaymentOrdersUseCase.getByCustomerId(
          Number(customerid),
        );
      res.json({ success: true, data: payments });
    } catch (err) {
      console.error("Error fetching customer payment orders:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * GET /api/customer-payment-orders/status/:status
   * Returns payment orders filtered by status (pending, paid, etc.)
   */
  async getByStatus(req, res) {
    try {
      const { status } = req.params;
      const payments =
        await this.getCustomerPaymentOrdersUseCase.getByStatus(status);
      res.json({ success: true, data: payments });
    } catch (err) {
      console.error("Error fetching payment orders by status:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /api/customer-payment-orders/:id/tracking
   * Body: { tracking_number: "JT1234567890" }
   * Updates tracking number → sets shipped_at + status="shipping" for all linked orders
   */
  async updateTracking(req, res) {
    try {
      const { id } = req.params;
      const { tracking_number, courier_name, fulfillment_branchid } = req.body;

      const updatedOrders =
        await this.getCustomerPaymentOrdersUseCase.updateTracking(
          Number(id),
          tracking_number,
          courier_name,
          fulfillment_branchid,
        );

      res.json({
        success: true,
        message: `${updatedOrders.length} order(s) updated to shipping with tracking number.`,
        data: updatedOrders,
      });
    } catch (err) {
      console.error("Error updating tracking number:", err.message);
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /api/customer-payment-orders/:id/delivered
   * Marks all linked orders as delivered → sets delivered_at + status="delivered"
   */
  async markDelivered(req, res) {
    try {
      const { id } = req.params;

      const updatedOrders =
        await this.getCustomerPaymentOrdersUseCase.markDelivered(Number(id));

      res.json({
        success: true,
        message: `${updatedOrders.length} order(s) marked as delivered.`,
        data: updatedOrders,
      });
    } catch (err) {
      console.error("Error marking orders as delivered:", err.message);
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }

  /**
   * PUT /api/customer-payment-orders/:id/refund-proof
   * Body: form-data with 'receipt' file
   * Upload refund receipt image and set refunded_at
   */
  async uploadRefundProof(req, res) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No refund receipt image provided." });
      }

      // We store the filename so the frontend can build the URL e.g., API_BASE.replace('/api', '') + /uploads/ + fileName
      const updatedPayment = await this.getCustomerPaymentOrdersUseCase.uploadRefundProof(
        Number(id),
        file.filename
      );

      res.json({
        success: true,
        message: "Refund proof uploaded successfully.",
        data: updatedPayment,
      });
    } catch (err) {
      console.error("Error uploading refund proof:", err.message);
      const status = err.message.includes("not found") ? 404 : 400;
      res.status(status).json({ success: false, message: err.message });
    }
  }
}
