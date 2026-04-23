export default class UpdateAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(appointmentid, data = {}) {
    if (!data || Object.keys(data).length === 0) {
      throw new Error("No data provided to update appointment");
    }

    console.log("UpdateAppointment data received:", data);
    const allowedFields = [
      "starttime",
      "endtime",
      "staffid",
      "notes",
      "status",
      "cancellationreason",
      "branchid",
    ];

    const fieldsToUpdate = {};

    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        fieldsToUpdate[key] = data[key];
      }
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new Error("No valid fields provided for appointment update");
    }

    const updated = await this.appointmentRepository.updateAppointment(
      appointmentid,
      fieldsToUpdate
    );

    if (!updated) throw new Error("Appointment not found or cannot update");
    return updated;
  }
}