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
  }) {
    const customer = await this.appointmentRepository.findCustomerIdByUserId(
      userId
    );

    if (!customer) {
      throw new Error("Customer profile not found for this user");
    }

    const appointment = await this.appointmentRepository.createAppointment({
      serviceid,
      customerid: customer.customerid,
      starttime,
      endtime,
      staffid,
      notes,
      priority,
    });

    return appointment;
  }
}
