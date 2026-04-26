export default class AnnouncementController {
  constructor(announcementRepository) {
    this.announcementRepository = announcementRepository;
  }

  async getAll(req, res) {
    try {
      const announcements = await this.announcementRepository.getAllAnnouncements();
      return res.json({ announcements });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getActive(req, res) {
    try {
      const { role } = req.query;
      const announcements = await this.announcementRepository.getActiveAnnouncements(role);
      return res.json({ success: true, announcements });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const announcement = await this.announcementRepository.getAnnouncementById(id);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      return res.json(announcement);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      console.log("[DEBUG] Creating announcement:", req.body);
      const newAnnouncement = await this.announcementRepository.createAnnouncement(req.body);
      return res.status(201).json({ message: "Announcement created", announcement: newAnnouncement });
    } catch (err) {
      console.error("[ERROR] Failed to create announcement:", err);
      return res.status(500).json({ message: err.message, stack: err.stack });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updatedAnnouncement = await this.announcementRepository.updateAnnouncement(id, req.body);
      
      if (!updatedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      return res.json({ message: "Announcement updated", announcement: updatedAnnouncement });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedAnnouncement = await this.announcementRepository.deleteAnnouncement(id);
      
      if (!deletedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      return res.json({ message: "Announcement deleted", announcement: deletedAnnouncement });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}
