export default class CreateServiceUseCase {
  constructor(serviceRepo) {
    this.serviceRepo = serviceRepo;
  }

  async execute({ servicename, servicetype, amount, image }) {
    if (!servicename || !servicetype || !amount || !image) {
      throw new Error("Missing required fields");
    }
    return await this.serviceRepo.createService({ servicename, servicetype, amount, image });
  }
}