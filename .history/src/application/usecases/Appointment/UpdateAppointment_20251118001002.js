// src/application/usecases/Appointment/UpdateAppointment.js
export default class UpdateAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentid, data = {}) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided to update appointment");
    }

    // Only pass fields that are actually provided
    const fieldsToUpdate = {};
    const allowedFields = [
      "starttime",
      "endtime",
      "staffid",
      "notes",
      "priority",
      "status",
    ];
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fieldsToUpdate[key] = data[key];
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new Error("No valid fields provided to update appointment");
    }

    const updated = await this.appointmentRepository.updateAppointment(
      appointmentid,
      fieldsToUpdate
    );

    if (!updated) throw new Error("Appointment not found or cannot update");
    return updated;
  }
}
