// src/interfaces/controllers/OrderController.js
import { CreateOrderUseCase } from "../../../application/usecases/Staff/CreateOrderUseCase.js";
import { PostgresOrderRepository } from "../../../infrastructure/repositories/StaffPos/PostgresOrderRepository.js";

const orderRepository = new PostgresOrderRepository();
const createOrderUseCase = new CreateOrderUseCase(orderRepository);

export const createOrder = async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.userId; // from JWT

    const total_amount = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );

    const result = await createOrderUseCase.execute(
      { total_amount },
      items,
      userId // pass users.userid, repository will map to customers.customerid
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Order failed", error: error.message });
  }
};
