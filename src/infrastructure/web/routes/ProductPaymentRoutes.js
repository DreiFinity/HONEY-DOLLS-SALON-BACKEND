// src/infrastructure/web/routes/ProductPaymentRoutes.js
import express from "express";
import CreateProductPayment from "../../../application/usecases/Payment/CreateProductPayment.js";
import CustomerPaymentRepositoryImpl from "../../repositories/Payment/CustomerProductPaymentRepositoryImpl.js";
import ProductPaymentController from "../../../interfaces/controllers/Payment/ProductPaymentController.js";
import CancelOrder from "../../../application/usecases/Order/CancelOrder.js";
import SyncTrackingStatus from "../../../application/usecases/Payment/SyncTrackingStatus.js";
import CustomerPaymentOrderRepositoryImpl from "../../repositories/Payment/CustomerPaymentOrderRepositoryImpl.js";
import auth from "../middleware/auth.js";

const router = express.Router();

const repository = new CustomerPaymentRepositoryImpl();
const createProductPaymentUseCase = new CreateProductPayment(repository);

const controller = new ProductPaymentController(createProductPaymentUseCase);

router.post("/product-payment", auth, controller.create.bind(controller));
router.post("/confirm-payment", auth, controller.paymentSuccess.bind(controller));

router.get("/payment-success", auth, async (req, res) => {
  try {
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");
    res.redirect(`${frontendUrl}/receipt`);
  } catch (err) {
    res.status(400).send("Payment verification failed: " + err.message);
  }
});

// ---------------- GET LATEST RECEIPT
router.get("/latest-receipt", auth, async (req, res) => {
  try {
    const customerid = req.user.customerid;
    const orders =
      await repository.getLatestCustomerPaymentWithOrders(customerid);
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/my-orders", auth, controller.getMyOrders.bind(controller));

router.get("/sync-my-trackings", auth, async (req, res) => {
  try {
    const customerid = req.user.customerid;
    const paymentRepo = new CustomerPaymentOrderRepositoryImpl();
    const syncTrackingUseCase = new SyncTrackingStatus(paymentRepo, repository);
    await syncTrackingUseCase.execute(customerid);
    res.json({ success: true, message: "Tracking synchronization completed." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/cancel/:reference_code", auth, controller.cancel.bind(controller));

// ---------------- TRACK PARCEL WITH TRACKINGMORE
router.get("/track/:tracking_number", auth, async (req, res) => {
  try {
    const { tracking_number } = req.params;
    const { courier } = req.query; // Admin specified courier name (e.g., "SPX PH" or "J&T")
    const trackingApiKey = process.env.TRACKINGMORE_API_KEY;

    // IF MOCK OR NO KEY: Return sample data so user can test UI
    if (!trackingApiKey || trackingApiKey === "mock") {
      console.log("Using Mock Tracking Data for:", tracking_number);
      return res.json({
        success: true,
        data: {
          tracking_number: tracking_number,
          courier_code: "jtexpress",
          delivery_status: "transit",
          origin_info: {
            trackinfo: [
              {
                checkpoint_date: new Date().toISOString(),
                checkpoint_status: "In Transit",
                location: "Davao Distribution Center",
                status_description: "Parcel has arrived at the local hub.",
              },
              {
                checkpoint_date: new Date(Date.now() - 86400000).toISOString(),
                checkpoint_status: "Shipped",
                location: "Main Warehouse",
                status_description: "Parcel has been picked up by courier.",
              },
              {
                checkpoint_date: new Date(Date.now() - 172800000).toISOString(),
                checkpoint_status: "Pending",
                location: "System",
                status_description: "Shipment information received.",
              },
            ],
          },
        },
      });
    }

    // Call TrackingMore v4 create endpoint (v4/trackings/realtime does not exist)
    const axios = (await import("axios")).default;
    const axiosConfig = {
      headers: {
        "Tracking-Api-Key": trackingApiKey,
        "Content-Type": "application/json",
      },
    };

    // 1. Determine courier code (Priority: Manual Map > Auto Detect > Fallback)
    let courierCode = "";
    const cName = (courier || "").toLowerCase();

    // Specific mapping for PH couriers
    if (cName.includes("shopee") || cName.includes("spx") || tracking_number.startsWith("PH") || tracking_number.startsWith("SPEPH")) {
      courierCode = "spx-ph"; // Shopee Xpress PH (Correct v4 code)
    } else if (cName.includes("j&t") || cName.includes("jt")) {
      courierCode = "jtexpress";
    } else if (cName.includes("flash")) {
      courierCode = "flashexpress-ph";
    } else if (cName.includes("ninja")) {
      courierCode = "ninja-van-ph";
    }

    // If still empty, try auto-detection
    if (!courierCode) {
      try {
        const detectRes = await axios.post(
          "https://api.trackingmore.com/v4/carriers/detect",
          { tracking_number: tracking_number },
          axiosConfig
        );
        if (detectRes.data.data && detectRes.data.data.length > 0) {
          courierCode = detectRes.data.data[0].courier_code;
        }
      } catch (detErr) {
        console.warn("Courier detection failed:", detErr.message);
      }
    }

    // Default to jtexpress if all else fails
    if (!courierCode) courierCode = "jtexpress";
    console.log(`Tracking with courier: ${courierCode} (${tracking_number})`);

    // 2. Create the tracking (v4 uses /create for real-time fetch)
    try {
      const response = await axios.post(
        "https://api.trackingmore.com/v4/trackings/create",
        { tracking_number: tracking_number, courier_code: courierCode },
        axiosConfig
      );

      const trackingData = response.data.data;
      if (trackingData.delivery_status === 'delivered') {
        try {
          await repository.markDeliveredByTracking(tracking_number);
          console.log(`Auto-updated DB to delivered for tracking: ${tracking_number}`);
        } catch (dbErr) {
          console.error(`Failed to auto-update DB for tracking ${tracking_number}:`, dbErr.message);
        }
      } else if (trackingData.scheduled_delivery_date) {
        try {
          // Sync estimated delivery date if not delivered yet
          await repository.updateEstimatedDeliveryByTracking(tracking_number, trackingData.scheduled_delivery_date);
          console.log(`Synced estimated delivery date for tracking: ${tracking_number}`);
        } catch (dbErr) {
          console.error(`Failed to sync estimated delivery date for tracking ${tracking_number}:`, dbErr.message);
        }
      }

      res.json({ success: true, data: trackingData });
    } catch (err) {
      const metaCode = err.response?.data?.meta?.code;
      const statusCode = err.response?.status;

      // Handle 'Already exists' (409 Conflict OR meta codes 4016, 4101)
      if (statusCode === 409 || metaCode === 409 || metaCode === 4016 || metaCode === 4101) {
        console.log(`Tracking exists (Code: ${metaCode}), fetching latest info...`);
        const getResponse = await axios.get(
          `https://api.trackingmore.com/v4/trackings/get?tracking_numbers=${tracking_number}&courier_code=${courierCode}`,
          axiosConfig
        );
        const trackingData = getResponse.data.data?.[0] || getResponse.data.data;

        if (trackingData.delivery_status === 'delivered') {
          try {
            await repository.markDeliveredByTracking(tracking_number);
            console.log(`Auto-updated DB to delivered for tracking: ${tracking_number}`);
          } catch (dbErr) {
            console.error(`Failed to auto-update DB for tracking ${tracking_number}:`, dbErr.message);
          }
        } else if (trackingData.scheduled_delivery_date) {
          try {
            // Sync estimated delivery date if not delivered yet
            await repository.updateEstimatedDeliveryByTracking(tracking_number, trackingData.scheduled_delivery_date);
            console.log(`Synced estimated delivery date for tracking: ${tracking_number}`);
          } catch (dbErr) {
            console.error(`Failed to sync estimated delivery date for tracking ${tracking_number}:`, dbErr.message);
          }
        }

        return res.json({ success: true, data: trackingData });
      }

      console.error("Tracking API Error:", err.response?.data || err.message);
      res.status(statusCode || 500).json({
        success: false,
        message: err.response?.data?.meta?.message || "Failed to track parcel.",
      });
    }
  } catch (err) {
    console.error("Internal API Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
