import axios from "axios";

export default class SyncTrackingStatus {
  constructor(paymentRepository, productPaymentRepository) {
    this.paymentRepository = paymentRepository;
    this.productPaymentRepository = productPaymentRepository;
    this.apiKey = process.env.TRACKINGMORE_API_KEY;
  }

  async execute(customerId = null) {
    if (!this.apiKey || this.apiKey === "mock") {
      console.log("Tracking sync skipped: MOCK or NO API KEY");
      return;
    }

    try {
      const activeTrackings = await this.paymentRepository.getActiveTrackings(customerId);
      if (activeTrackings.length === 0) return;

      console.log(`Starting tracking sync for ${activeTrackings.length} orders...`);

      const axiosConfig = {
        headers: {
          "Tracking-Api-Key": this.apiKey,
          "Content-Type": "application/json",
        },
      };

      for (const tracking of activeTrackings) {
        const { tracking_number, courier_name } = tracking;
        let courierCode = this._getCourierCode(tracking_number, courier_name);

        try {
          // Fetch latest info from TrackingMore
          const getResponse = await axios.get(
            `https://api.trackingmore.com/v4/trackings/get?tracking_numbers=${tracking_number}&courier_code=${courierCode}`,
            axiosConfig
          );
          
          const trackingData = getResponse.data.data?.[0] || getResponse.data.data;
          if (!trackingData) continue;

          if (trackingData.delivery_status === 'delivered') {
            await this.productPaymentRepository.markDeliveredByTracking(tracking_number);
            console.log(`[Auto-Sync] Marked ${tracking_number} as delivered.`);
          } else if (trackingData.scheduled_delivery_date) {
            await this.productPaymentRepository.updateEstimatedDeliveryByTracking(tracking_number, trackingData.scheduled_delivery_date);
          }
        } catch (err) {
          // If 404, it might not be created in TrackingMore yet, we can ignore for now
          if (err.response?.status !== 404) {
            console.error(`[Auto-Sync] Error syncing ${tracking_number}:`, err.message);
          }
        }
      }
    } catch (error) {
      console.error("[Auto-Sync] Global Sync Error:", error.message);
    }
  }

  _getCourierCode(tracking_number, courier) {
    const cName = (courier || "").toLowerCase();
    if (cName.includes("shopee") || cName.includes("spx") || tracking_number.startsWith("PH") || tracking_number.startsWith("SPEPH")) {
      return "spx-ph";
    } else if (cName.includes("j&t") || cName.includes("jt")) {
      return "jtexpress";
    } else if (cName.includes("flash")) {
      return "flashexpress-ph";
    } else if (cName.includes("ninja")) {
      return "ninja-van-ph";
    }
    return "jtexpress"; // default
  }
}
