// src/interfaces/controllers/Service/ServiceController.js
export default class ServiceController {
  constructor(serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  async getAll(req, res) {
    try {
      const services = await this.serviceRepository.getAllServices();
      return res.json({ services });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}
