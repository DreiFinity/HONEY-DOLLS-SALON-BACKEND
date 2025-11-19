export default class GetAppointments {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  async execute(filters = {}) {
    return this.appointmentRepository.getAppointments(filters);
  }
}
