import { mapOrderImages } from "../../../utils/mapOrderImages.js";
import { mapPaymentImages } from "../../../utils/mapPaymentImages.js";

export default class ProductPaymentController {
  constructor(createProductPaymentUseCase) {
    this.createProductPaymentUseCase = createProductPaymentUseCase;
  }

  async create(req, res) {
    try {
      const result = await this.createProductPaymentUseCase.execute(
        req.body,
        req.user.customerid, // ✅ pass logged in customer
      );

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
  async getMyOrders(req, res) {
    try {
      const customerid = req.user.customerid;
      let orders =
        await this.createProductPaymentUseCase.customerPaymentRepository.getAllCustomerPaymentWithOrders(
          customerid,
        );

      // Wrap in array if it's a single object
      if (!Array.isArray(orders)) {
        orders = [orders];
      }

      const mappedOrders = mapPaymentImages(orders);

      res.json({ success: true, data: mappedOrders });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async cancel(req, res) {
    try {
      const customerid = req.user.customerid;
      const { reference_code } = req.params;
      const cancelledOrders =
        await this.createProductPaymentUseCase.customerPaymentRepository.cancelOrdersByReferenceCode(
          reference_code,
          customerid,
        );
      res.json({
        success: true,
        message: `${cancelledOrders.length} order(s) cancelled successfully.`,
        data: cancelledOrders,
      });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
  async paymentSuccess(req, res) {
    try {
      const session_id = req.query.session_id;
      const customerid = req.user.customerid;

      const result =
        await this.createProductPaymentUseCase.confirmPaymongoPayment(
          session_id,
          customerid,
        );

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
  // src/interfaces/controllers/ProductPaymentController.js

  async latestReceipt(req, res) {
    try {
      const customerid = req.user.customerid;
      const orders =
        await this.createProductPaymentUseCase.customerPaymentRepository.getLatestPaidReceipt(
          customerid,
        );

      res.json({ success: true, data: orders });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
