import express from "express";
import auth from "../middleware/auth.js";
import ReservationPaymentRepositoryImpl from "../../repositories/Payment/ReservationPaymentRepositoryImpl.js";
import CreateReservationPayment from "../../../application/usecases/Payment/CreateReservationPayment.js";

const router = express.Router();

const repository = new ReservationPaymentRepositoryImpl();
const createReservationPayment = new CreateReservationPayment(repository);

// ── Create reservation payment (customer) ────────────────────────
router.post("/create", auth, async (req, res) => {
  try {
    const customerid = req.user.customerid;
    const { appointmentid } = req.body;

    const payment = await createReservationPayment.execute({
      appointmentid,
      customerid,
    });

    res.json({
      success: true,
      data: payment,
      checkout_url: payment.checkout_url,
    });
  } catch (err) {
    console.error("Reservation payment error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Confirm payment (frontend calls after redirect) ──────────────
router.post("/confirm", auth, async (req, res) => {
  try {
    const { session_id } = req.body;
    const payment = await createReservationPayment.confirmPayment(session_id);
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Verify payment by appointment ID ─────────────────────────────
router.post("/verify-by-appointment", auth, async (req, res) => {
  try {
    const { appointmentid } = req.body;
    const paymentRecord = await repository.getByAppointmentId(appointmentid);
    
    if (!paymentRecord || !paymentRecord.paymongo_id) {
      return res.json({ success: false, message: "No payment session found" });
    }
    
    const payment = await createReservationPayment.confirmPayment(paymentRecord.paymongo_id);
    res.json({ success: true, data: payment });
  } catch (err) {
    // Return 200 so the frontend doesn't throw a hard error, but success: false
    res.status(200).json({ success: false, message: err.message });
  }
});

// ── Get ALL reservation payments for a specific appointment ───────
router.get("/appointment/:appointmentid/all", auth, async (req, res) => {
  try {
    const payments = await repository.getPaymentsByAppointmentId(req.params.appointmentid);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Get reservation payment for a specific appointment (single) ───
router.get("/appointment/:appointmentid", auth, async (req, res) => {
  try {
    const payment = await repository.getByAppointmentId(req.params.appointmentid);
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Get all reservation payments for current customer ────────────
router.get("/my-payments", auth, async (req, res) => {
  try {
    const customerid = req.user.customerid;
    const payments = await repository.getByCustomerId(customerid);
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Create balance payment for 75% (staff/admin) ─────────────────
router.post("/create-balance", auth, async (req, res) => {
  try {
    const { appointmentid } = req.body;
    if (!appointmentid) throw new Error("appointmentid is required");

    const payment = await createReservationPayment.createBalanceCheckout(appointmentid);

    res.json({
      success: true,
      data: payment,
      checkout_url: payment.balance_checkout_url,
    });
  } catch (err) {
    console.error("Balance payment error:", err.message);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Mark reservation payment as paid manually (staff/admin) ────────
router.post("/mark-paid", auth, async (req, res) => {
  try {
    const { appointmentid, type } = req.body; // type can be 'reservation' or 'balance'
    if (!appointmentid) throw new Error("appointmentid is required");

    let payment;
    if (type === "balance") {
      payment = await repository.markBalancePaidManually(appointmentid);
    } else {
      payment = await repository.markReservationPaidManually(appointmentid);
    }

    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Get all reservation payments (admin) ─────────────────────────
router.get("/all", auth, async (req, res) => {
  try {
    const payments = await repository.getAll();
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

export default router;
