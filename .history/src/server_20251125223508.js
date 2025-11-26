// src/server.js
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { config } from "./config/env.js";
import { pool } from "./infrastructure/db/index.js";
import LoginRoutes from "./infrastructure/web/routes/LoginRoutes.js";
import RegisterRoutes from "./infrastructure/web/routes/RegisterRoutes.js";
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
import orderRoutes from "./infrastructure/web/routes/orderRoutes.js";
import PurchaseOrderRepositoryImpl from "./infrastructure/repositories/Purchase/PurchaseRepositoryImpl.js";
import PurchaseOrderRoutes from "./infrastructure/web/routes/PurchaseOrderRoutes.js";
import CustomerPaymentRepositoryImpl from "./infrastructure/repositories/Payment/CustomerPaymentRepositoryImpl.js";
import CustomerPaymentRoutes from "./infrastructure/web/routes/CustomerPaymentRoutes.js";

const appointmentRepository = new AppointmentRepositoryImpl();
const userRepository = new UserRepositoryImpl();
const hashService = new BcryptService();
const serviceRepository = new ServiceRepositoryImpl();
const staffRepository = new StaffRepositoryImpl();
const productRepository = new ProductRepositoryImpl();
const purchaseOrderRepository = new PurchaseOrderRepositoryImpl();
const paymentRepository = new CustomerPaymentRepositoryImpl();

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", LoginRoutes);
app.use("/api/customer", RegisterRoutes(userRepository, hashService));
app.use("/api/appointment", AppointmentRoutes(appointmentRepository));
app.use("/api/staff", StaffRoute(staffRepository));
app.use("/api/stafflogin", StaffRouteLogin);

app.use("/api/stafflogin", StaffRouteLogin);
app.use("/api/services", ServiceRoutes(serviceRepository));
app.use("/api/products", ProductRoutes(productRepository));
app.use("/api/orders", orderRoutes);
app.use("/api/purchase", PurchaseOrderRoutes(purchaseOrderRepository));
app.use("/api/customerpayment", CustomerPaymentRoutes(paymentRepository));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "C:/NAGBA_ANDREI/salon/upload"))
);

// Test route
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
