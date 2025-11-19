export default class CreateAppointment {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute({
    userId,
    services, // <-- array of services [{serviceid, quantity, price}]
    starttime,
    endtime,
    staffid,
    notes,
    priority,
    status = null,
    recurring = false,
    recurrencerule = null,
  }) {
    const customerId = await this.appointmentRepository.findCustomerIdByUserId(
      userId
    );

    if (!customerId) {
      throw new Error("Customer profile not found for this user");
    }

    const appointment = await this.appointmentRepository.createAppointment({
      customerid: customerId,
      starttime,
      endtime,
      staffid,
      notes,
      priority,
      status,
      recurring,
      recurrencerule,
      services, // pass the array
    });

    return appointment;
  }
}
