import CreateAppointment from "../../../application/usecases/Appointment/CreateAppointment.js";
import UpdateAppointment from "../../../application/usecases/Appointment/UpdateAppointment.js";
import DeleteAppointment from "../../../application/usecases/Appointment/DeleteAppointment.js";
import GetAppointments from "../../../application/usecases/Appointment/GetAppointments.js";

export default class AppointmentController {
  constructor(appointmentRepository) {
    this.createUsecase = new CreateAppointment(appointmentRepository);
    this.updateUsecase = new UpdateAppointment(appointmentRepository);
    this.deleteUsecase = new DeleteAppointment(appointmentRepository);
    this.getUsecase = new GetAppointments(appointmentRepository);
  }

  async create(req, res) {
    try {
      const {
        serviceid,
        starttime,
        endtime,
        staffid,
        notes = "",
        priority = "medium",
        status = null,
        recurring = false,
        recurrencerule = null,
      } = req.body || {}; // default to empty object

      // Validation
      if (!serviceid || !starttime || !endtime || !staffid) {
        return res.status(400).json({
          message: "serviceid, starttime, endtime, and staffid are required",
        });
      }

      const appointment = await this.createUsecase.execute({
        userId: req.userId,
        serviceid,
        starttime,
        endtime,
        staffid,
        notes,
        priority,
        status,
        recurring,
        recurrencerule,
      });

      return res.json({ message: "Appointment created", appointment });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      const appointment = await this.updateUsecase.execute(
        req.params.id,
        req.body
      );
      return res.json({ message: "Appointment updated", appointment });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  async delete(req, res) {
    try {
      const appointment = await this.deleteUsecase.execute(req.params.id);
      return res.json({ message: "Appointment deleted", appointment });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  async get(req, res) {
    try {
      const filters = {
        staffid: req.query.staffid,
        customerid: req.query.customerid,
      };
      const appointments = await this.getUsecase.execute(filters);
      return res.json({ appointments });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
}
