export default class DeleteServiceUseCase {
  constructor(serviceRepo) {
    this.serviceRepo = serviceRepo;
  }

  async execute(serviceId) {
    if (!serviceId) throw new Error("Service ID required");
    return await this.serviceRepo.deleteService(serviceId);
  }
}