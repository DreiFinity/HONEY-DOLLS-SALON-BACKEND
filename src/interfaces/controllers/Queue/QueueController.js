export default class QueueController {
  constructor(queueRepository) {
    this.queueRepository = queueRepository;
  }

  async getAll(req, res) {
    try {
      const branchid = req.user.role === "staff" ? req.user.branchid : (req.query.branchid || null);
      const queue = await this.queueRepository.getTodayQueue(branchid);
      return res.json({ queue });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getUpcoming(req, res) {
    try {
      const branchid = req.user.role === "staff" ? req.user.branchid : (req.query.branchid || null);
      const queue = await this.queueRepository.getUpcomingQueue(branchid);
      return res.json({ queue });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { customername, staffid, notes, services, branchid } = req.body;

      if (!customername || !Array.isArray(services) || services.length === 0) {
        return res.status(400).json({
          message: "Customer name and at least one service are required",
        });
      }

      const queue = await this.queueRepository.createWalkIn({
        customername,
        staffid,
        notes,
        services,
        branchid,
      });

      return res.status(201).json({
        message: "Walk-in added to queue",
        queue,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;

      console.log("Full Request Body:", req.body);
      const { status, positionoverride, notes, isarrived, staffid } = req.body;
      const payload = {};

      if (status !== undefined) payload.status = status;
      if (positionoverride !== undefined) payload.positionoverride = positionoverride;
      if (notes !== undefined) payload.notes = notes;
      if (isarrived !== undefined) payload.isarrived = isarrived;
      if (staffid !== undefined) payload.staffid = staffid;

      if (Object.keys(payload).length === 0) {
        console.error("No valid fields found in body:", req.body);
        return res.status(400).json({ 
          message: "No valid fields to update",
          receivedBody: req.body 
        });
      }

      if (payload.status === "serving") {
        payload.calledat = new Date();
        payload.servicestartat = new Date();
      }

      if (payload.status === "done") {
        payload.serviceendat = new Date();
      }

      const updated = await this.queueRepository.updateQueue(id, payload);

      if (!updated) {
        return res.status(404).json({ message: "Queue entry not found" });
      }

      return res.json({
        message: "Queue updated",
        queue: updated,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getAdminQueue(req, res) {
    try {
      const queue = await this.queueRepository.getTodayQueueAdmin();
      return res.json({ queue });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getStatus(req, res) {
    try {
      const { id } = req.params;
      const queue = await this.queueRepository.getById(id);
      if (!queue) return res.status(404).json({ message: "Queue entry not found" });
      return res.json({ status: queue.status });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.queueRepository.deleteQueue(id);

      if (!deleted) {
        return res.status(404).json({ message: "Queue entry not found" });
      }

      return res.json({
        message: "Queue entry removed",
        queue: deleted,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}