import CreateCustomerPaymentUseCase from "../../../application/usecases/CreateCustomerPaymentUseCase.js";

export default class CustomerPaymentController {
  constructor(paymentRepository) {
    this.createPaymentUseCase = new CreateCustomerPaymentUseCase(
      paymentRepository
    );
  }

  async create(req, res) {
    try {
      const { orderid, reference_code, partialamountpaid, method } = req.body;

      if (!orderid || !partialamountpaid || !method) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const payment = await this.createPaymentUseCase.execute({
        orderid,
        reference_code,
        partialamountpaid,
        method,
      });

      return res.status(201).json({
        message: "Payment recorded successfully",
        payment,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}
