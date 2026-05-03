import CreateAppointment from "../../../application/usecases/Appointment/CreateAppointment.js";
import UpdateAppointment from "../../../application/usecases/Appointment/UpdateAppointment.js";
import DeleteAppointment from "../../../application/usecases/Appointment/DeleteAppointment.js";
import GetAppointments from "../../../application/usecases/Appointment/GetAppointments.js";
import CreateReservationPayment from "../../../application/usecases/Payment/CreateReservationPayment.js";

export default class AppointmentController {
  constructor(appointmentRepository, queueRepository, reservationPaymentRepository) {
    this.appointmentRepository = appointmentRepository;
    this.queueRepository = queueRepository;
    this.reservationPaymentRepository = reservationPaymentRepository;
    this.createUsecase = new CreateAppointment(appointmentRepository, reservationPaymentRepository);
    this.updateUsecase = new UpdateAppointment(appointmentRepository);
    this.deleteUsecase = new DeleteAppointment(appointmentRepository);
    this.getUsecase = new GetAppointments(appointmentRepository);
    this.refundUsecase = new CreateReservationPayment(reservationPaymentRepository);
  }

  async create(req, res) {
    try {
      const services = req.body.services;

      if (!Array.isArray(services) || services.length === 0) {
        return res
          .status(400)
          .json({ message: "Services must be a non-empty array" });
      }

      console.log("DEBUG AppointmentController create body:", req.body);
      console.log("DEBUG branchid raw:", req.body.branchid);
      console.log("DEBUG branchId raw:", req.body.branchId);

      const result = await this.createUsecase.execute({
        userId: req.user.id,
        services,
        starttime: req.body.starttime,
        endtime: req.body.endtime,
        staffid: req.body.staffid,
        notes: req.body.notes,
        priority: req.body.priority,
        status: req.body.status || "pending",
        branchid: req.body.branchid ? Number(req.body.branchid) : (req.body.branchId ? Number(req.body.branchId) : null),
      });

      return res.json({
        message: "Appointment created",
        appointment: result.appointment,
        payment: result.payment,
        checkout_url: result.checkout_url,
        error: result.error
      });
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

      // Handle Refund if triggered
      if (req.body.triggerRefund && this.refundUsecase) {
        try {
          console.log(`DEBUG: Triggering automated PayMongo refund for appointment: ${req.params.id}`);
          await this.refundUsecase.refundAppointmentPayment(req.params.id);
        } catch (refundErr) {
          console.error("Failed to process automated refund:", refundErr.message);
          // We don't throw here to avoid failing the whole update if refund fails
          // but we already logged it.
        }
      }

      // If the appointment was confirmed, sync it to the queue
      console.log(`DEBUG: AppointmentController update - Status: ${req.body.status}, QueueRepo: ${!!this.queueRepository}`);
      if (req.body.status === "confirmed" && this.queueRepository) {
        try {
          console.log(`DEBUG: Triggering sync to queue for appointment: ${req.params.id}`);
          await this.queueRepository.syncAppointmentToQueue(req.params.id);
        } catch (syncErr) {
          console.error("Failed to sync appointment to queue:", syncErr);
        }
      }

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
      let isReceptionist = false;

      if (req.user.role === "customer") {
        const customerid = await this.appointmentRepository.findCustomerIdByUserId(
          req.user.id
        );
        filters.customerid = customerid;
      } else if (req.user.role === "staff") {
        // If staff is a RECEPTIONIST or MANAGER, they should see all appointments
        const specs = req.user.specializations;
        isReceptionist = !!(specs && (
          (Array.isArray(specs) && specs.some(s =>
            s.toLowerCase().includes("receptionist") ||
            s.toLowerCase().includes("queue monitoring")
          )) ||
          (typeof specs === "string" && (
            specs.toLowerCase().includes("receptionist") ||
            specs.toLowerCase().includes("queue monitoring")
          ))
        ));

        const isManager = !!(specs && (
          (Array.isArray(specs) && specs.some(s =>
            s.toLowerCase().includes("manager")
          )) ||
          (typeof specs === "string" &&
            specs.toLowerCase().includes("manager")
          )
        ));

        if (isReceptionist || isManager) {
          filters = {};
          if (req.query.staffid && req.query.staffid !== "null") filters.staffid = req.query.staffid;
          if (req.query.customerid && req.query.customerid !== "null") filters.customerid = req.query.customerid;
          if (req.query.branchid && req.query.branchid !== "null") filters.branchid = req.query.branchid;
        } else {
          const staffid = await this.appointmentRepository.findStaffIdByUserId(
            req.user.id
          );
          filters.staffid = staffid;
        }
      } else {
        filters = {};
        if (req.query.staffid && req.query.staffid !== "null") filters.staffid = req.query.staffid;
        if (req.query.customerid && req.query.customerid !== "null") filters.customerid = req.query.customerid;
      }

      console.log("DEBUG Appointment Get:", {
        user: req.user.id,
        role: req.user.role,
        specs: req.user.specializations,
        isReceptionist,
        filters
      });

      const appointments = await this.getUsecase.execute(filters);
      return res.json({ appointments });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  async getById(req, res) {
    try {
      const appointments = await this.getUsecase.execute({});
      const appointment = appointments.find(a => a.appointmentid === parseInt(req.params.id));

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      return res.json(appointment);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
}