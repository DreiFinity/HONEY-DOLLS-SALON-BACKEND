// src/interfaces/controllers/Branch/ProductTransferController.js
export default class ProductTransferController {
  constructor(transferUseCase, getAllTransfersUseCase, getAllBranchesUseCase, confirmArrivalUseCase, getIncomingTransfersUseCase) {
    this.transferUseCase = transferUseCase;
    this.getAllTransfersUseCase = getAllTransfersUseCase;
    this.getAllBranchesUseCase = getAllBranchesUseCase;
    this.confirmArrivalUseCase = confirmArrivalUseCase;
    this.getIncomingTransfersUseCase = getIncomingTransfersUseCase;
  }

  async transferHandler(req, res) {
    try {
      const { productid, from_branchid, to_branchid, quantity, remarks } = req.body;
      const userid = req.user.id; // From auth middleware

      const result = await this.transferUseCase.execute({
        productid,
        from_branchid,
        to_branchid,
        quantity,
        userid,
        remarks
      });

      res.status(201).json({
        success: true,
        message: "Product transferred successfully",
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async listTransfersHandler(req, res) {
    try {
      const transfers = await this.getAllTransfersUseCase.execute();
      res.status(200).json({
        success: true,
        data: transfers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async listBranchesHandler(req, res) {
    try {
      const branches = await this.getAllBranchesUseCase.execute();
      res.status(200).json({
        success: true,
        data: branches
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async confirmArrivalHandler(req, res) {
    try {
      const { id } = req.params;
      const result = await this.confirmArrivalUseCase.execute(id);
      res.status(200).json({
        success: true,
        message: "Product arrival confirmed",
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async listIncomingTransfersHandler(req, res) {
    try {
      const { branchid } = req.params;
      const transfers = await this.getIncomingTransfersUseCase.execute(branchid);
      res.status(200).json({
        success: true,
        data: transfers
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}
