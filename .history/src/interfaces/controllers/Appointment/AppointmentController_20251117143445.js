import CreateAppointment from "../../../application/usecases/Appointment/CreateAppointment.js";

export default class AppointmentController {
  constructor(appointmentRepository) {
    this.createUsecase = new CreateAppointment(appointmentRepository);
  }

  async create(req, res) {
    try {
      const appointment = await this.createUsecase.execute({
        userId: req.userId, // from JWT middleware
        serviceid: req.body.serviceid,
        starttime: req.body.starttime,
        endtime: req.body.endtime,
        staffid: req.body.staffid,
        notes: req.body.notes,
        priority: req.body.priority,
      });

      return res.json({ message: "Appointment created", appointment });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
}
