export default class UpdateAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentid, data) {
    const updated = await this.appointmentRepository.updateAppointment(
      appointmentid,
      data
    );
    if (!updated) throw new Error("Appointment not found or cannot update");
    return updated;
  }
}
