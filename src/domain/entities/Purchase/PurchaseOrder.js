export default class PurchaseOrder {
  constructor({ purchaseid, supplierid, status, branchid, dateordered }) {
    this.purchaseid = purchaseid;
    this.supplierid = supplierid;
    this.status = status;
    this.branchid = branchid;
    this.dateordered = dateordered;
  }
}
