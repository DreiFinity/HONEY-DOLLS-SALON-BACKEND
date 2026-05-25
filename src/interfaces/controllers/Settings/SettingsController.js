export default class SettingsController {
  constructor(settingsRepository) {
    this.settingsRepository = settingsRepository;
  }

  async getAll(req, res) {
    try {
      const settings = await this.settingsRepository.getAll();
      return res.json({ success: true, data: settings });
    } catch (err) {
      console.error("Get settings error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { settings } = req.body; // e.g., { downpayment_percentage: 25, max_delivery_weight: 20 }
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({ success: false, message: "Settings object is required" });
      }

      for (const [key, val] of Object.entries(settings)) {
        await this.settingsRepository.update(key, val);
      }

      const updated = await this.settingsRepository.getAll();
      return res.json({ success: true, message: "Settings updated successfully", data: updated });
    } catch (err) {
      console.error("Update settings error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
