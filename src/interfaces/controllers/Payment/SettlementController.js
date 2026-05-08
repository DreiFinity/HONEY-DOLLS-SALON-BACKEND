export default class SettlementController {
  constructor(settlementRepository) {
    this.settlementRepository = settlementRepository;
  }

  async create(req, res) {
    try {
      const { reservationPaymentIds, method } = req.body;
      if (!Array.isArray(reservationPaymentIds) || reservationPaymentIds.length === 0) {
        return res.status(400).json({ message: "At least one reservation payment ID is required" });
      }

      const settlement = await this.settlementRepository.createSettlement({
        reservationPaymentIds,
        method: method || "cash"
      });

      const fullSettlement = await this.settlementRepository.getSettlementById(settlement.settlementid);
      return res.status(201).json({ success: true, settlement: fullSettlement });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const settlement = await this.settlementRepository.getSettlementById(id);
      if (!settlement) return res.status(404).json({ message: "Settlement not found" });
      return res.json({ success: true, settlement });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async markAsPaid(req, res) {
    try {
      const { id } = req.params;
      const { method, paymongo_id, checkout_url } = req.body;

      await this.settlementRepository.markAsPaid(id, {
        method: method || "cash",
        paymongo_id,
        checkout_url
      });

      const updatedSettlement = await this.settlementRepository.getSettlementById(id);
      return res.json({ success: true, settlement: updatedSettlement });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async confirm(req, res) {
    try {
      const { paymongo_id } = req.body;
      if (!paymongo_id) return res.status(400).json({ message: "paymongo_id is required" });

      const settlement = await this.settlementRepository.confirmSettlementPayment(paymongo_id);
      return res.json({ success: true, settlement });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getAll(req, res) {
    try {
      const settlements = await this.settlementRepository.getAllSettlements();
      return res.json({ success: true, data: settlements });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}
