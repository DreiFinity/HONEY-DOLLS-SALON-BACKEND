// src/application/usecases/Branch/TransferProductStock.js
export default class TransferProductStock {
  constructor(productTransferRepo, inventoryRepo, adminRepo) {
    this.productTransferRepo = productTransferRepo;
    this.inventoryRepo = inventoryRepo;
    this.adminRepo = adminRepo;
  }

  async execute({ productid, from_branchid, to_branchid, quantity, userid, remarks }) {
    if (from_branchid === to_branchid) {
      throw new Error("Source and destination branches cannot be the same.");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than zero.");
    }

    // Resolve adminid from userid
    const admin = await this.adminRepo.findByUserId(userid);
    if (!admin || !admin.adminid) {
      throw new Error("Only registered admins can perform product transfers.");
    }

    const adminid = admin.adminid;

    // 1. Check stock availability in from_branchid
    const inventory = await this.inventoryRepo.getBranchInventory(from_branchid);
    const product = inventory.find(p => p.productid === parseInt(productid));

    if (!product) {
      throw new Error("Product not found in source branch inventory.");
    }

    if (product.stock < quantity) {
      throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
    }

    // 2. Perform transfer
    return await this.productTransferRepo.createTransfer({
      productid,
      from_branchid,
      to_branchid,
      quantity,
      adminid,
      remarks
    });
  }
}
