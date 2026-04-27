export default class GetReservationPayments {
  constructor(reservationPaymentRepository) {
    this.reservationPaymentRepository = reservationPaymentRepository;
  }

  async execute(appointmentid) {
    if (!appointmentid) {
      throw new Error("Appointment ID is required");
    }
    return this.reservationPaymentRepository.getPaymentsByAppointmentId(appointmentid);
  }
}
