// src/server.js
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
console.log("DIRECT ENV CHECK:", process.env.PAYMONGO_SECRET_KEY);

import { config } from "./config/env.js";
import { pool } from "./infrastructure/db/index.js";
import onlineOrderRoutes from "./infrastructure/web/routes/onlineOrderRoutes.js";

import QueueRoutes from "./infrastructure/web/routes/QueueRoutes.js";
import ReservationPaymentRepositoryImpl from "./infrastructure/repositories/Payment/ReservationPaymentRepositoryImpl.js";
import QueueRepositoryImpl from "./infrastructure/repositories/Queue/QueueRepositoryImpl.js";
import { UserRepositoryImpl } from "./infrastructure/repositories/Login/UserRepositoryImpl.js";
import { BcryptService } from "./infrastructure/security/BcryptService.js";
import AppointmentRoutes from "./infrastructure/web/routes/AppointmentRoutes.js";
import { AppointmentRepositoryImpl } from "./infrastructure/repositories/Appointment/AppointmentRepositoryImpl.js";
import StaffRoute from "././infrastructure/web/routes/StaffRoutes.js";
import StaffRepositoryImpl from "./infrastructure/repositories/Staff/StaffRepositoryImpl.js";
import StaffRouteLogin from "./infrastructure/web/routes/StaffRoutesLogin.js";
import ServiceRoutes from "./infrastructure/web/routes/ServiceRoutes.js";
import ServiceRepositoryImpl from "./infrastructure/repositories/Service/ServiceRepositoryImpl.js";
import ProductRoutes from "./infrastructure/web/routes/ProductRoutes.js";
import ProductRepositoryImpl from "./infrastructure/repositories/Product/ProductRepositoryImpl.js";

import PurchaseOrderRepositoryImpl from "./infrastructure/repositories/Purchase/PurchaseRepositoryImpl.js";
import PurchaseOrderRoutes from "./infrastructure/web/routes/PurchaseOrderRoutes.js";
import AuthRoutes from "./infrastructure/web/routes/AuthRoutes.js";
import FetchUserRoutes from "./infrastructure/web/routes/FetchUserRoutes.js";
import customerAddressRoutes from "./infrastructure/web/routes/customerAddressRoutes.js";
import ProductPaymentRoutes from "./infrastructure/web/routes/ProductPaymentRoutes.js";
import PayMongoWebhookRoutes from "./infrastructure/web/routes/PayMongoWebhookRoutes.js";
import CustomerPaymentOrderRoutes from "./infrastructure/web/routes/CustomerPaymentOrderRoutes.js";
import BranchRoutes from "./infrastructure/web/routes/BranchRoutes.js";
import SupplierPurchaseRoutes from "./infrastructure/web/routes/SupplierPurchaseRoutes.js";
import SupplierRoutes from "./infrastructure/web/routes/SupplierRoutes.js";
import customerAdminRoutes from "./infrastructure/web/routes/CustomerAdminRoutes.js";
import InventoryRoutes from "./infrastructure/web/routes/InventoryRoutes.js";
import ReturnRoutes from "./infrastructure/web/routes/ReturnRoutes.js";
import ReservationPaymentRoutes from "./infrastructure/web/routes/ReservationPaymentRoutes.js";
import ProductAdjustmentsRoutes from "./infrastructure/web/routes/ProductAdjustmentsRoutes.js";
import ProductTransferRoutes from "./infrastructure/web/routes/ProductTransferRoutes.js";
import ProductAdjustmentsRepositoryImpl from "./infrastructure/repositories/ProductAdjustments/ProductAdjustmentsRepositoryImpl.js";
import AdminSalesRoutes from "./infrastructure/web/routes/AdminSalesRoutes.js";
import CustomerPaymentOrderRepositoryImpl from "./infrastructure/repositories/Payment/CustomerPaymentOrderRepositoryImpl.js";
import CustomerProductPaymentRepositoryImpl from "./infrastructure/repositories/Payment/CustomerProductPaymentRepositoryImpl.js";
import SyncTrackingStatus from "./application/usecases/Payment/SyncTrackingStatus.js";

import AnnouncementRoutes from "./infrastructure/web/routes/AnnouncementRoutes.js";
import AnnouncementRepositoryImpl from "./infrastructure/repositories/Admin/AnnouncementRepositoryImpl.js";
import SettlementRoutes from "./infrastructure/web/routes/SettlementRoutes.js";

const appointmentRepository = new AppointmentRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const hashService = new BcryptService();
const serviceRepository = new ServiceRepositoryImpl();
const staffRepository = new StaffRepositoryImpl();
const productRepository = new ProductRepositoryImpl();
const productAdjustmentsRepository = new ProductAdjustmentsRepositoryImpl();
const purchaseOrderRepository = new PurchaseOrderRepositoryImpl();
const announcementRepository = new AnnouncementRepositoryImpl();

const queueRepository = new QueueRepositoryImpl();
const reservationPaymentRepository = new ReservationPaymentRepositoryImpl();

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const uploadPath = path.join(process.cwd(), "upload");
console.log("Serving static files from:", uploadPath);
app.use("/api/uploads", express.static(uploadPath));

// Routes
app.use("/api/queue", QueueRoutes(queueRepository));
app.use("/api/auth", AuthRoutes);
app.use("/api/user", FetchUserRoutes);

app.use("/api/appointment", AppointmentRoutes(appointmentRepository, queueRepository, reservationPaymentRepository));
app.use("/api/staff", StaffRoute(staffRepository));
app.use("/api/branches", BranchRoutes);

app.use("/api/stafflogin", StaffRouteLogin);
app.use("/api/services", ServiceRoutes(serviceRepository));
app.use("/api/products", ProductRoutes(productRepository));
app.use("/api/product-adjustments", ProductAdjustmentsRoutes(productAdjustmentsRepository));
app.use("/api/product-transfers", ProductTransferRoutes);

app.use("/api/purchase", PurchaseOrderRoutes(purchaseOrderRepository));
app.use("/api/supplier-purchase", SupplierPurchaseRoutes);
app.use("/api/suppliers", SupplierRoutes);
app.use("/api/admin/sales", AdminSalesRoutes);
app.use("/api/inventory", InventoryRoutes);
app.use("/api/online-orders", onlineOrderRoutes);
app.use("/api/customer-address", customerAddressRoutes);
app.get("/test", (req, res) => {
  console.log("Test route hit!");
  res.send("Server is live");
});
app.use("/api/payment", ProductPaymentRoutes);

app.use("/api/payment", PayMongoWebhookRoutes);
app.use("/api/customer-payment-orders", CustomerPaymentOrderRoutes);
app.use("/api/inventory", InventoryRoutes);
app.use("/api/returns", ReturnRoutes);
app.use("/api/reservation-payment", ReservationPaymentRoutes);
app.use("/api/admin/customers", customerAdminRoutes);
app.use("/api/announcements", AnnouncementRoutes(announcementRepository));
app.use("/api/settlements", SettlementRoutes);

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Server running!", dbTime: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

const PORT = config.port || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Initialize and start background tracking sync
  const paymentRepo = new CustomerPaymentOrderRepositoryImpl();
  const productPaymentRepo = new CustomerProductPaymentRepositoryImpl();
  const syncTrackingUseCase = new SyncTrackingStatus(paymentRepo, productPaymentRepo);

  // Initial sync after 10 seconds to avoid overloading startup
  setTimeout(() => {
    syncTrackingUseCase.execute().catch(err => console.error("Initial Tracking Sync Error:", err));
  }, 10000);

  // Sync every hour
  setInterval(() => {
    syncTrackingUseCase.execute().catch(err => console.error("Background Tracking Sync Error:", err));
  }, 60 * 60 * 1000);
});
