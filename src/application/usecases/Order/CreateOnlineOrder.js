export default class CreateOnlineOrder {
  constructor(onlineOrderRepository) {
    this.onlineOrderRepository = onlineOrderRepository;
  }

  async execute(orderData) {
    // Just mark it as online
    orderData.order_channel = "online";

    // Create order in repository
    return await this.onlineOrderRepository.create(orderData);
  }
}
