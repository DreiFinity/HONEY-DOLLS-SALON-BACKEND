import CreateAppointment from "../../../application/usecases/Appointment/CreateAppointment.js";
import UpdateAppointment from "../../../application/usecases/Appointment/UpdateAppointment.js";
import DeleteAppointment from "../../../application/usecases/Appointment/DeleteAppointment.js";
import GetAppointments from "../../../application/usecases/Appointment/GetAppointments.js";

export default class AppointmentController {
  constructor(appointmentRepository) {
    this.appointmentRepository = appointmentRepository;
    this.createUsecase = new CreateAppointment(appointmentRepository);
    this.updateUsecase = new UpdateAppointment(appointmentRepository);
    this.deleteUsecase = new DeleteAppointment(appointmentRepository);
    this.getUsecase = new GetAppointments(appointmentRepository);
  }

  async create(req, res) {
    try {
      const services = req.body.services;

      if (!Array.isArray(services) || services.length === 0) {
        return res
          .status(400)
          .json({ message: "Services must be a non-empty array" });
      }

      const appointment = await this.createUsecase.execute({
        userId: req.user.id,
        services,
        starttime: req.body.starttime,
        endtime: req.body.endtime,
        staffid: req.body.staffid,
        notes: req.body.notes,
        priority: req.body.priority,
        status: req.body.status || "pending",
        recurring: req.body.recurring || false,
        recurrencerule: req.body.recurrencerule || null,
      });

      return res.json({ message: "Appointment created", appointment });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  async update(req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "No data provided to update" });
      }

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
      let filters = {};

      if (req.user.role === "customer") {
        const customerid = await this.appointmentRepository.findCustomerIdByUserId(
          req.user.id
        );
        filters.customerid = customerid;
      } else if (req.user.role === "staff") {
        const staffid = await this.appointmentRepository.findStaffIdByUserId(
          req.user.id
        );
        filters.staffid = staffid;
      } else {
        filters = {
          staffid: req.query.staffid,
          customerid: req.query.customerid,
        };
      }

      const appointments = await this.getUsecase.execute(filters);
      return res.json({ appointments });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
}