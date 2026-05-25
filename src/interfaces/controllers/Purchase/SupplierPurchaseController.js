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
      let checkout = null;
      
      const paymentTerms = {
        type: payment?.payment_type || 'IMMEDIATE',
        days: payment?.payment_term_days || 0
      };

      const purchase = await this.createUseCase.execute({ supplierid, status, branchid }, items, paymentTerms);

      const isPayMongo = (payment && (payment.method === 'GCASH' || payment.method === 'CARD'));
      const hasAmountToPayNow = payment && parseFloat(payment.amount) > 0;

      if (isPayMongo && hasAmountToPayNow) {
        console.log("Initiating PayMongo Checkout...");
        checkout = await this.payUseCase.createCheckout(
          purchase.purchaseid, 
          payment.amount, 
          payment.method, 
          payment.isDownpayment,
          paymentTerms.type,
          paymentTerms.days
        );
        console.log("Checkout created:", checkout?.checkout_url);
      } else {
        // Record payment in DB immediately
        // For PAYLATER with 0 amount, we still record a record to store payment terms
        await this.payUseCase.supplierPurchaseRepo.recordPayment({
          purchaseid: purchase.purchaseid,
          amount: payment?.amount || 0,
          method: payment?.method || null,
          paymongo_id: null,
          checkout_url: null,
          status: 'PENDING',
          payment_type: paymentTerms.type,
          payment_term_days: paymentTerms.days
        });
      }
      // For PAYLATER with 0 amount, we record NO payment history initially.

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
      
      const isPayMongo = (payment && (payment.method === 'GCASH' || payment.method === 'CARD'));
      const hasAmountToPayNow = payment && parseFloat(payment.amount) > 0;

      if (isPayMongo && hasAmountToPayNow) {
        checkout = await this.payUseCase.createCheckout(
          id, 
          payment.amount, 
          payment.method, 
          payment.isDownpayment,
          payment.payment_type,
          payment.payment_term_days
        );
      } else if (hasAmountToPayNow) {
        await this.payUseCase.supplierPurchaseRepo.recordPayment({
          purchaseid: id,
          amount: payment.amount,
          method: payment.method,
          paymongo_id: null,
          checkout_url: null,
          status: 'PENDING',
          payment_type: payment.payment_type,
          payment_term_days: payment.payment_term_days
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

  cancelHandler = async (req, res) => {
    try {
      const { id } = req.params;
      const result = await this.payUseCase.supplierPurchaseRepo.updateStatus(id, 'CANCELLED');
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  };
}
