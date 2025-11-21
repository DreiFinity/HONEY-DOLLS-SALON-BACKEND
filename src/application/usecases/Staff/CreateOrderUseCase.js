// src/application/usecases/CreateOrderUseCase.js
export class CreateOrderUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async execute(orderData, details, customerid) {
    // You can add validation, calculate total, etc.
    return await this.orderRepository.create(orderData, details, customerid);
  }
<<<<<<< HEAD
}
=======
}
>>>>>>> 8908797 (to debug orders)
