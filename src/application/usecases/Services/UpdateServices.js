export default class UpdateServiceUseCase {
  constructor(serviceRepo) {
    this.serviceRepo = serviceRepo;
  }

  async execute(serviceId, { servicename, servicetype, amount, image }) {
    if (!serviceId) throw new Error("Service ID required");
    return await this.serviceRepo.updateService(serviceId, { servicename, servicetype, amount, image });
  }
}