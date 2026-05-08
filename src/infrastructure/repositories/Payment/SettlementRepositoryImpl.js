import { pool } from "../../db/index.js";
import axios from "axios";
import { config } from "../../../config/env.js";

export default class SettlementRepositoryImpl {
  async createSettlement({ reservationPaymentIds, method = "cash" }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Create the settlement record
      const reference_code = `SET-${Math.floor(100000 + Math.random() * 900000)}`;
      const settlementRes = await client.query(
        `INSERT INTO reservation_settlements (reference_code, method, status) VALUES ($1, $2, 'pending') RETURNING *`,
        [reference_code, method]
      );
      const settlement = settlementRes.rows[0];

      // 2. Link the reservation payments
      for (const resPayId of reservationPaymentIds) {
        await client.query(
          `INSERT INTO settlement_items (settlementid, reservationpaymentid) VALUES ($1, $2)`,
          [settlement.settlementid, resPayId]
        );
      }

      await client.query("COMMIT");
      return settlement;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getSettlementById(id) {
    const query = `
      WITH settlement_items_expanded AS (
        SELECT DISTINCT 
          si.settlementid,
          rp.appointmentid,
          rp.queueid
        FROM settlement_items si
        JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
        WHERE si.settlementid = $1
      ),
      distinct_entities AS (
        SELECT DISTINCT settlementid, appointmentid, queueid FROM settlement_items_expanded
      ),
      service_totals AS (
        SELECT 
          de.settlementid,
          SUM(sv.amount) as total_services
        FROM distinct_entities de
        JOIN queue q ON (de.appointmentid = q.appointmentid OR de.queueid = q.queueid)
        JOIN queueservice qs ON q.queueid = qs.queueid
        JOIN service sv ON qs.serviceid = sv.serviceid
        GROUP BY de.settlementid
      ),
      fee_totals AS (
        SELECT 
          de.settlementid,
          COALESCE(SUM(rp.reservation_fee), 0) as total_fees
        FROM distinct_entities de
        JOIN reservationpayment rp ON (
          (de.appointmentid IS NOT NULL AND rp.appointmentid = de.appointmentid) OR 
          (de.queueid IS NOT NULL AND rp.queueid = de.queueid)
        )
        WHERE rp.status = 'paid'
        GROUP BY de.settlementid
      )
      SELECT 
        rs.*,
        (COALESCE(st.total_services, 0) - COALESCE(ft.total_fees, 0)) as total_balance,
        COALESCE(
          (SELECT JSON_AGG(
            JSONB_BUILD_OBJECT(
              'reservationpaymentid', rp.reservationpaymentid,
              'customername', q.customername,
              'reservation_fee', rp.reservation_fee,
              'payment_status', rp.status
            )
          ) FROM settlement_items si 
            JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
            LEFT JOIN queue q ON (rp.appointmentid = q.appointmentid OR rp.queueid = q.queueid)
            WHERE si.settlementid = rs.settlementid
          ),
          '[]'
        ) as items
      FROM reservation_settlements rs
      LEFT JOIN service_totals st ON rs.settlementid = st.settlementid
      LEFT JOIN fee_totals ft ON rs.settlementid = ft.settlementid
      WHERE rs.settlementid = $1
    `;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  }

  async markAsPaid(settlementId, { method, paymongo_id = null, checkout_url = null }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. If method is GCash and we don't have a paymongo_id yet, create a session
      let finalMethod = method;
      let finalPaymongoId = paymongo_id;
      let finalCheckoutUrl = checkout_url;

      if (method === 'gcash' && !paymongo_id) {
        const settlement = await this.getSettlementById(settlementId);
        if (!settlement) throw new Error("Settlement not found");

        const balanceAmount = Number(settlement.total_balance);
        if (balanceAmount <= 0) throw new Error("No balance remaining.");

        const response = await axios.post(
          "https://api.paymongo.com/v1/checkout_sessions",
          {
            data: {
              attributes: {
                send_email_receipt: true,
                show_description: true,
                show_line_items: true,
                line_items: [{
                  name: `Consolidated Service Payment`,
                  description: `Payment for multiple services (Settlement #${settlementId})`,
                  amount: Math.max(Math.round(balanceAmount * 100), 2000), // PHP in centavos (min 20 PHP)
                  currency: "PHP",
                  quantity: 1,
                }],
                payment_method_types: ["gcash"],
                success_url: `${config.frontendUrl}/staff/queueing?payment=success&settlement=${settlementId}`,
                cancel_url: `${config.frontendUrl}/staff/queueing?payment=cancelled&settlement=${settlementId}`,
              },
            },
          },
          {
            auth: {
              username: config.paymongoSecret,
              password: "",
            },
          }
        );

        finalPaymongoId = response.data.data.id;
        finalCheckoutUrl = response.data.data.attributes.checkout_url;
        // Keep status as pending until they actually pay via GCash
      }

      const status = (finalMethod === 'cash') ? 'paid' : 'pending';
      const paidAt = (finalMethod === 'cash') ? 'CURRENT_TIMESTAMP' : 'NULL';

      const updateQuery = `
        UPDATE reservation_settlements 
        SET status = $1, 
            method = $2, 
            paymongo_id = $3, 
            checkout_url = $4, 
            paid_at = ${paidAt},
            updated_at = CURRENT_TIMESTAMP
        WHERE settlementid = $5
        RETURNING *
      `;
      const res = await client.query(updateQuery, [status, finalMethod, finalPaymongoId, finalCheckoutUrl, settlementId]);
      const settlement = res.rows[0];

      if (status === 'paid') {
        // Trigger queue updates for all linked items
        const itemsRes = await client.query(
          `SELECT 
             COALESCE(rp.queueid, q.queueid) as queueid, 
             rp.appointmentid, 
             rp.reservationpaymentid
           FROM settlement_items si
           JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
           LEFT JOIN queue q ON (rp.appointmentid IS NOT NULL AND q.appointmentid = rp.appointmentid)
           WHERE si.settlementid = $1`,
          [settlementId]
        );

        for (const item of itemsRes.rows) {
          if (item.queueid) {
             await client.query(
               `UPDATE queue SET status = 'done', updatedat = CURRENT_TIMESTAMP WHERE queueid = $1`,
               [item.queueid]
             );
          }
          if (item.appointmentid) {
             await client.query(
               `UPDATE appointment SET status = 'completed', updatedat = CURRENT_TIMESTAMP WHERE appointmentid = $1`,
               [item.appointmentid]
             );
          }
          // Mark reservationpayment as paid
          await client.query(
             `UPDATE reservationpayment SET status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE reservationpaymentid = $1`,
             [item.reservationpaymentid]
          );
        }
      }

      await client.query("COMMIT");
      return settlement;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async confirmSettlementPayment(paymongoId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Verify with PayMongo
      const response = await axios.get(
        `https://api.paymongo.com/v1/checkout_sessions/${paymongoId}`,
        { auth: { username: config.paymongoSecret, password: "" } }
      );

      const session = response.data.data;
      console.log("DEBUG: PayMongo Session Status:", session.attributes.status);
      
      // In webhooks for 'checkout_session.payment.paid', we trust the event
      // but we still verify the session exists. We allow 'active' or 'paid'.
      if (session.attributes.status !== "paid" && session.attributes.status !== "active") {
        throw new Error(`Payment not completed. Status: ${session.attributes.status}`);
      }

      const updateQuery = `
        UPDATE reservation_settlements 
        SET status = 'paid', 
            paid_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE paymongo_id = $1
        RETURNING *
      `;
      const res = await client.query(updateQuery, [paymongoId]);
      const settlement = res.rows[0];
      
      if (!settlement) {
        console.log("DEBUG: Settlement not found in DB for paymongoId:", paymongoId);
      } else {
        console.log("DEBUG: Settlement found and updated in DB:", settlement.settlementid);
      }

      if (settlement) {
        console.log("DEBUG: Settlement found and updated in DB:", settlement.settlementid);
        // Trigger queue updates for all linked items
        const itemsRes = await client.query(
          `SELECT 
             COALESCE(rp.queueid, q.queueid) as queueid, 
             rp.appointmentid, 
             si.reservationpaymentid
           FROM settlement_items si
           JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
           LEFT JOIN queue q ON (rp.appointmentid IS NOT NULL AND q.appointmentid = rp.appointmentid)
           WHERE si.settlementid = $1`,
          [settlement.settlementid]
        );

        console.log(`DEBUG: Updating ${itemsRes.rows.length} linked items for settlement ${settlement.settlementid}`);

        for (const item of itemsRes.rows) {
          const queueId = item.queueid;
          if (queueId) {
             await client.query(
               `UPDATE queue SET status = 'done', updatedat = CURRENT_TIMESTAMP WHERE queueid = $1`,
               [queueId]
             );
          }
          if (item.appointmentid) {
             await client.query(
               `UPDATE appointment SET status = 'completed', updatedat = CURRENT_TIMESTAMP WHERE appointmentid = $1`,
               [item.appointmentid]
             );
          }
          // Mark reservationpayment as paid
          await client.query(
             `UPDATE reservationpayment SET status = 'paid', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE reservationpaymentid = $1`,
             [item.reservationpaymentid]
          );
        }
      } else {
        console.log("DEBUG: No settlement record found with paymongo_id:", paymongoId);
      }

      await client.query("COMMIT");
      return settlement;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async getAllSettlements() {
    const result = await pool.query(
      `SELECT rs.*, 
              (SELECT COUNT(*) FROM settlement_items WHERE settlementid = rs.settlementid) AS item_count,
              (SELECT STRING_AGG(COALESCE(c.firstname, q.customername), ', ')
               FROM settlement_items si
               JOIN reservationpayment rp ON si.reservationpaymentid = rp.reservationpaymentid
               LEFT JOIN appointment a ON rp.appointmentid = a.appointmentid
               LEFT JOIN customers c ON a.customerid = c.customerid
               LEFT JOIN queue q ON rp.queueid = q.queueid
               WHERE si.settlementid = rs.settlementid
              ) AS customer_names
       FROM reservation_settlements rs
       ORDER BY rs.created_at DESC`
    );
    return result.rows;
  }
}
