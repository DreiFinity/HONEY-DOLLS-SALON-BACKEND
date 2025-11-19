export default class UpdateAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentid, data = {}) {
    // default to empty object
    const { starttime, endtime, staffid, notes, priority, status } = data;

    const updated = await this.appointmentRepository.updateAppointment(
      appointmentid,
      {
        starttime,
        endtime,
        staffid,
        notes,
        priority,
        status,
      }
    );

    if (!updated) throw new Error("Appointment not found or cannot update");
    return updated;
  }
}
