// src/application/usecases/Appointment/CreateAppointment.js
export default class CreateAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({
    userId,
    serviceid,
    starttime,
    endtime,
    staffid,
    notes,
    priority,
    status = null,
    recurring = false,
    recurrencerule = null,
  }) {
    // Find customer
    const customerId = await this.appointmentRepository.findCustomerIdByUserId(
      userId
    );

    if (!customerId) {
      throw new Error("Customer profile not found for this user");
    }

    // Create appointment
    const appointment = await this.appointmentRepository.createAppointment({
      serviceid,
      customerid: customerId, // fixed: pass number directly
      starttime,
      endtime,
      staffid,
      notes,
      priority,
      status,
      recurring,
      recurrencerule,
    });

    return appointment;
  }
}
