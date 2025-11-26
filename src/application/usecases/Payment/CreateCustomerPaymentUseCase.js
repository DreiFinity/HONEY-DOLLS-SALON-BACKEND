export default class CreateCustomerPaymentUseCase {
  constructor(paymentRepository) {
    this.paymentRepository = paymentRepository;
  }

  async execute(paymentData) {
    return await this.paymentRepository.createPayment(paymentData);
  }
}
