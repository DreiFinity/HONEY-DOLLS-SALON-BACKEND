// src/application/usecases/Appointment/UpdateAppointment.js
export default class UpdateAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentid, data = {}) {
    const { starttime, endtime, staffid, notes, priority, status } = data;

    // Optional: validate required fields if you want them mandatory for reschedule
    if (!starttime || !endtime) {
      throw new Error(
        "starttime and endtime are required to update appointment"
      );
    }

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
