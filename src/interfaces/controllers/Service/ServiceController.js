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

  async getById(req, res) {
    try {
      const { id } = req.params;
      const service = await this.serviceRepository.getServiceById(id);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      return res.json(service);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      console.log("[DEBUG] ServiceController.create req.body:", req.body);
      console.log("[DEBUG] ServiceController.create req.file:", req.file);

      const { servicename, servicetype, amount, image } = req.body;

      if (!servicename || !servicetype || !amount || !image) {
        const missing = {
          servicename: !servicename,
          servicetype: !servicetype,
          amount: !amount,
          image: !image
        };
        console.log("[DEBUG] Validation failed. Missing fields:", missing);
        return res.status(400).json({ 
          message: "Missing required fields",
          missing 
        });
      }

      const newService = await this.serviceRepository.createService({
        servicename,
        servicetype,
        amount,
        image,
      });

      return res.status(201).json(newService);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { servicename, servicetype, amount, image } = req.body;

      const updatedService = await this.serviceRepository.updateService(id, {
        servicename,
        servicetype,
        amount,
        image,
      });

      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }

      return res.json(updatedService);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const deletedService = await this.serviceRepository.deleteService(id);

      if (!deletedService) {
        return res.status(404).json({ message: "Service not found" });
      }

      return res.json({
        message: "Service deleted successfully",
        service: deletedService,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}