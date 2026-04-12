export default class ProductReturnController {
  constructor(requestReturnUseCase, getCustomerReturnsUseCase) {
    this.requestReturnUseCase = requestReturnUseCase;
    this.getCustomerReturnsUseCase = getCustomerReturnsUseCase;
  }

  async requestReturn(req, res) {
    try {
      const returnData = req.body;

      console.log("FILES RECEIVED:", req.files);
      console.log("BODY RECEIVED:", req.body);

      // Handle multiple file uploads if present
      if (req.files && req.files.length > 0) {
        returnData.customer_evidence_image = req.files.map(file => file.filename).join(", ");
      }

      // Use the ID from the authenticated token for security
      if (req.user && req.user.customerid) {
        returnData.customerid = req.user.customerid;
      }

      console.log("Requesting Return for Customer:", returnData.customerid, "Order:", returnData.orderid);

      const result = await this.requestReturnUseCase.execute(returnData);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      console.error("Error in requestReturn:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getMyReturns(req, res) {
    try {
      const customerid = req.user.customerid;
      if (!customerid) {
        return res.status(400).json({ success: false, message: "Customer profile not found for this user." });
      }
      const result = await this.getCustomerReturnsUseCase.execute(Number(customerid));
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("Error in getMyReturns:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getByCustomer(req, res) {
    try {
      const { customerid } = req.params;
      const result = await this.getCustomerReturnsUseCase.execute(Number(customerid));
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("Error in getByCustomer:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getAll(req, res) {
    try {
      // In a real app, this would be admin-only
      const result = await this.getCustomerReturnsUseCase.returnRepository.getAllReturns();
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("Error in getAllReturns:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const { returnid } = req.params;
      const { status } = req.body;
      const result = await this.requestReturnUseCase.updateStatus(Number(returnid), status);
      res.json({ success: true, data: result });
    } catch (err) {
      console.error("Error in updateStatus:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async processReturnRefund(req, res) {
    try {
      const { returnid } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No refund receipt image provided." });
      }

      const result = await this.requestReturnUseCase.processReturnRefund(Number(returnid), file.filename);
      res.json({ success: true, message: "Refund proof uploaded successfully.", data: result });
    } catch (err) {
      console.error("Error in processReturnRefund:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  }
}
