export default class SupplierPurchaseController {
  constructor(createUseCase, listUseCase, getByIdUseCase, payUseCase) {
    this.createUseCase = createUseCase;
    this.listUseCase = listUseCase;
    this.getByIdUseCase = getByIdUseCase;
    this.payUseCase = payUseCase;
  }

  createHandler = async (req, res) => {
    try {
      console.log("Create Purchase Header Body:", JSON.stringify(req.body, null, 2));
      const { supplierid, status, items, payment, branchid } = req.body;
      const purchase = await this.createUseCase.execute({ supplierid, status, branchid }, items);

      let checkout = null;
      console.log("Checking payment method:", payment?.method);
      
      const dbAmount = payment.isDownpayment ? payment.amount : 0;

      if (payment && (payment.method === 'GCASH' || payment.method === 'CARD')) {
        console.log("Initiating PayMongo Checkout...");
        checkout = await this.payUseCase.createCheckout(purchase.purchaseid, payment.amount, payment.method, payment.isDownpayment);
        console.log("Checkout created:", checkout?.checkout_url);
      } else {
        // Record payment in DB ONLY for CASH (PayMongo is handled inside createCheckout)
        await this.payUseCase.supplierPurchaseRepo.recordPayment({
          purchaseid: purchase.purchaseid,
          amount: dbAmount,
          method: payment.method,
          paymongo_id: null,
          checkout_url: null,
          status: 'PENDING'
        });
      }

      res.status(201).json({ success: true, ...purchase, checkout });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  addPaymentHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const { payment } = req.body;
      
      let checkout = null;
      const dbAmount = payment.isDownpayment ? payment.amount : 0;

      if (payment && (payment.method === 'GCASH' || payment.method === 'CARD')) {
        checkout = await this.payUseCase.createCheckout(id, payment.amount, payment.method, payment.isDownpayment);
      } else {
        await this.payUseCase.supplierPurchaseRepo.recordPayment({
          purchaseid: id,
          amount: dbAmount,
          method: payment.method,
          paymongo_id: null,
          checkout_url: null,
          status: 'PENDING'
        });
      }

      res.status(201).json({ success: true, checkout });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  listHandler = async (req, res) => {
    try {
      const result = await this.listUseCase.execute();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  detailHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.getByIdUseCase.execute(id);
      if (!result) return res.status(404).json({ success: false, message: "Purchase not found" });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  recordsHandler = async (req, res) => {
    try {
      const result = await this.payUseCase.supplierPurchaseRepo.fetchPaymentRecords();
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };

  arrivalHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.payUseCase.supplierPurchaseRepo.updateStatus(id, 'ARRIVED');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
