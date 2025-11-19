export default class DeleteAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentid) {
    const deleted = await this.appointmentRepository.deleteAppointment(
      appointmentid
    );
    if (!deleted) throw new Error("Appointment not found or cannot delete");
    return deleted;
  }
}
