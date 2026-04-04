import { pool } from "../../db/index.js";

export default class CustomerProductPaymentRepositoryImpl {
  async getOrdersByIds(orderIds) {
    const result = await pool.query(
      `SELECT * FROM orders WHERE orderid = ANY($1)`,
      [orderIds],
    );
    return result.rows;
  }

  async getOrderItems(orderid) {
    const result = await pool.query(
      `
      SELECT 
        od.quantity,
        od.unit_price,
        p.productid,
        p.prodname
      FROM orderdetails od
      LEFT JOIN products p 
        ON p.productid = od.productid
      WHERE od.orderid = $1
      `,
      [orderid],
    );
    return result.rows;
  }

  async getCustomerWithEmail(customerid) {
    const result = await pool.query(
      `
      SELECT c.firstname, c.lastname, c.contact, u.email
      FROM customers c
      LEFT JOIN users u ON u.userid = c.userid
      WHERE c.customerid = $1
      `,
      [customerid],
    );
    return result.rows[0];
  }

  async createPaymentWithOrders(data) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const paymentResult = await client.query(
        `
        INSERT INTO customerpayment
        (customerid, reference_code, method, status, currency,
         checkout_url, paymongo_id, delivery_fee, 
         shipping_street, shipping_barangay, shipping_city, 
         shipping_province, shipping_postal_code, courier_name, 
         estimated_delivery_date)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        RETURNING *
        `,
        [
          data.customerid,
          data.reference_code,
          data.method,
          data.status,
          data.currency,
          data.checkout_url,
          data.paymongo_id,
          data.delivery_fee || 0,
          data.shipping_street,
          data.shipping_barangay,
          data.shipping_city,
          data.shipping_province,
          data.shipping_postal_code,
          data.courier_name,
          data.estimated_delivery_date,
        ],
      );

      const paymentId = paymentResult.rows[0].customerpaymentid;

      for (const orderid of data.orderIdsArray) {
        await client.query(
          `
          INSERT INTO customerpayment_orders
          (customerpaymentid, orderid)
          VALUES ($1,$2)
          `,
          [paymentId, orderid],
        );

        await client.query(
          `
          UPDATE orders
          SET status='processing',
              updatedat=CURRENT_TIMESTAMP
          WHERE orderid=$1
          `,
          [orderid],
        );
      }

      await client.query("COMMIT");

      return paymentResult.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  // src/infrastructure/repositories/Payment/CustomerPaymentRepositoryImpl.js

  async getLatestPaidReceipt(customerid) {
    const result = await pool.query(
      `
    SELECT 
      o.orderid,
      o.status,
      cp.shipping_street,
      cp.shipping_barangay,
      cp.shipping_city,
      cp.shipping_province,
      cp.shipping_postal_code,
      cp.courier_name,
      cp.estimated_delivery_date,
      cp.method,
      cp.reference_code,
      cp.delivery_fee,
      od.productid,
      od.quantity,
      od.unit_price,
      p.prodname
    FROM customerpayment cp
    JOIN customerpayment_orders cpo
      ON cp.customerpaymentid = cpo.customerpaymentid
    JOIN orders o
      ON o.orderid = cpo.orderid
    JOIN orderdetails od
      ON od.orderid = o.orderid
    JOIN products p
      ON p.productid = od.productid
    WHERE cp.customerid = $1
      AND cp.status = 'paid'
    ORDER BY o.orderid DESC
    `,
      [customerid],
    );

    return result.rows;
  }
  async getPaymentByPaymongoId(paymongo_id, customerid) {
    const result = await pool.query(
      `SELECT * FROM customerpayment WHERE paymongo_id=$1 AND customerid=$2`,
      [paymongo_id, customerid],
    );
    return result.rows[0];
  }
  async markPaymentAndOrdersPaid(customerpaymentid, customerid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update payment status
      await client.query(
        `UPDATE customerpayment SET status='paid', updatedat=CURRENT_TIMESTAMP WHERE customerpaymentid=$1 AND customerid=$2`,
        [customerpaymentid, customerid],
      );

      // Update all related orders
      await client.query(
        `UPDATE orders
       SET status='processing', updatedat=CURRENT_TIMESTAMP
       WHERE orderid IN (SELECT orderid FROM customerpayment_orders WHERE customerpaymentid=$1)`,
        [customerpaymentid],
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async markPaymentAndOrdersPaidBySession(sessionId) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const paymentRes = await client.query(
        `SELECT * FROM customerpayment WHERE paymongo_id = $1`,
        [sessionId],
      );

      if (!paymentRes.rows.length) {
        console.log("Payment not found in DB for session:", sessionId);
        await client.query("ROLLBACK");
        return null;
      }

      const payment = paymentRes.rows[0];
      console.log("Found payment in DB:", payment.customerpaymentid);

      // Update payment
      await client.query(
        `UPDATE customerpayment SET status='paid', updated_at=CURRENT_TIMESTAMP WHERE customerpaymentid=$1`,
        [payment.customerpaymentid],
      );

      // Update linked orders
      await client.query(
        `UPDATE orders o
       SET status='processing', updatedat=CURRENT_TIMESTAMP
       FROM customerpayment_orders cpo
       WHERE o.orderid=cpo.orderid AND cpo.customerpaymentid=$1`,
        [payment.customerpaymentid],
      );

      await client.query("COMMIT");
      return payment;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Webhook DB error:", err);
      return null;
    } finally {
      client.release();
    }
  }

  // Get latest paid orders for a customer
  async getCustomerOrdersWithProducts(customerid) {
    const res = await pool.query(
      `
      SELECT o.orderid, o.status, cp.method, o.createdat,
             od.productid, od.quantity, od.unit_price, p.prodname
      FROM orders o
      JOIN customerpayment_orders cpo ON o.orderid = cpo.orderid
      JOIN customerpayment cp ON cp.customerpaymentid = cpo.customerpaymentid
      JOIN orderdetails od ON od.orderid = o.orderid
      JOIN products p ON p.productid = od.productid
      WHERE cp.customerid=$1 AND cp.status='paid'
      ORDER BY o.orderid DESC
      `,
      [customerid],
    );
    return res.rows;
  }

  async getLatestCustomerPaymentWithOrders(customerid) {
    const result = await pool.query(
      `
    SELECT
      cp.customerpaymentid,
      cp.reference_code,
      cp.method,
      cp.status,
      cp.currency,
      cp.checkout_url,
      cp.paymongo_id,
      cp.delivery_fee,
      cp.shipping_street,
      cp.shipping_barangay,
      cp.shipping_city,
      cp.shipping_province,
      cp.shipping_postal_code,
      cp.courier_name,
      cp.tracking_number,
      cp.estimated_delivery_date,
      cp.refund_receipt_image,
      cp.refunded_at,
      cp.updated_at AS payment_date,
      json_agg(
        json_build_object(
          'orderid', o.orderid,
          'status', o.status,
          'items', (
            SELECT json_agg(
              json_build_object(
                'orderdetailsid', od.orderdetailsid,
                'productid', p.productid,
                'prodname', p.prodname,
                'prodcat', p.prodcat,
                'quantity', od.quantity,
                'unit_price', od.unit_price,
                'prodimage', p.prodimage
              )
            )
            FROM orderdetails od
            LEFT JOIN products p ON p.productid = od.productid
            WHERE od.orderid = o.orderid
          )
        )
      ) AS orders
    FROM customerpayment cp
    JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
    JOIN orders o ON o.orderid = cpo.orderid
    WHERE cp.customerid = $1
    GROUP BY cp.customerpaymentid
    ORDER BY cp.updated_at DESC
    LIMIT 1
  `,
      [customerid],
    );

    return result.rows[0]; // already nested
  }

  async getAllCustomerPaymentWithOrders(customerid) {
    const result = await pool.query(
      `
    SELECT
      cp.customerpaymentid,
      cp.reference_code,
      cp.method,
      cp.status,
      cp.currency,
      cp.checkout_url,
      cp.paymongo_id,
      cp.delivery_fee,
      cp.shipping_street,
      cp.shipping_barangay,
      cp.shipping_city,
      cp.shipping_province,
      cp.shipping_postal_code,
      cp.courier_name,
      cp.tracking_number,
      cp.estimated_delivery_date,
      cp.refund_receipt_image,
      cp.refunded_at,
      cp.updated_at AS payment_date,
      json_agg(
        json_build_object(
          'orderid', o.orderid,
          'status', o.status,
          'items', (
            SELECT json_agg(
              json_build_object(
                'orderdetailsid', od.orderdetailsid,
                'productid', p.productid,
                'prodname', p.prodname,
                'prodcat', p.prodcat,
                'quantity', od.quantity,
                'unit_price', od.unit_price,
                'prodimage', p.prodimage
              )
            )
            FROM orderdetails od
            LEFT JOIN products p ON p.productid = od.productid
            WHERE od.orderid = o.orderid
          )
        )
      ) AS orders
    FROM customerpayment cp
    JOIN customerpayment_orders cpo ON cpo.customerpaymentid = cp.customerpaymentid
    JOIN orders o ON o.orderid = cpo.orderid
    WHERE cp.customerid = $1
    GROUP BY cp.customerpaymentid
    ORDER BY cp.updated_at ASC
  `,
      [customerid],
    );

    return result.rows; // <-- return all rows
  }

  async getOrderBySessionId(session_id) {
    const result = await pool.query(
      `SELECT 
        cp.reference_code,
        cp.method,
        cp.status,
        cp.currency,
        cp.delivery_fee,
        cp.shipping_street,
        cp.shipping_barangay,
        cp.shipping_city,
        cp.shipping_province,
        cp.shipping_postal_code,
        cp.courier_name,
        cp.estimated_delivery_date,
        o.orderid,
        od.productid,
        od.quantity,
        od.unit_price,
        p.prodname
     FROM customerpayment cp
     LEFT JOIN customerpayment_orders cpo
        ON cp.customerpaymentid = cpo.customerpaymentid
     LEFT JOIN orders o
        ON o.orderid = cpo.orderid
     LEFT JOIN orderdetails od
        ON od.orderid = o.orderid
     LEFT JOIN products p
        ON p.productid = od.productid
     WHERE cp.paymongo_id = $1`,
      [session_id],
    );

    return result.rows;
  }

  async cancelOrdersByReferenceCode(reference_code, customerid) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Find the identifying customerpayment to get its ID
      const cpResult = await client.query(
        `SELECT customerpaymentid FROM customerpayment 
         WHERE reference_code = $1 AND customerid = $2`,
        [reference_code, customerid]
      );

      if (cpResult.rowCount === 0) {
        throw new Error("Payment record not found or unauthorized");
      }

      const cpId = cpResult.rows[0].customerpaymentid;

      // 2. Update all linked orders to cancelled if they are not already delivered/shipped
      const result = await client.query(
        `
        UPDATE orders o
        SET status = 'cancelled', updatedat = CURRENT_TIMESTAMP
        FROM customerpayment_orders cpo
        WHERE o.orderid = cpo.orderid
          AND cpo.customerpaymentid = $1
          AND o.status IN ('pending', 'processing')
        RETURNING o.*;
        `,
        [cpId]
      );

      if (result.rowCount === 0) {
        // If it was already shipping, we might have hit a wall based on the requirement.
        // But let's check if there are orders that are just 'paid' etc.
        // If we want to be more permissive, we could allow 'shipping' as well.
        // For now, let's stick to 'pending' and 'processing' to be safe.
        throw new Error("No eligible orders found to cancel. They might already be shipping or delivered.");
      }

      await client.query("COMMIT");
      return result.rows;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async markDeliveredByTracking(tracking_number) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Update customerpayment delivered_at if not already set
      const cpUpdate = await client.query(
        `UPDATE customerpayment 
         SET delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE tracking_number = $1 AND delivered_at IS NULL
         RETURNING customerpaymentid`,
        [tracking_number]
      );

      if (cpUpdate.rowCount === 0) {
        // Either not found or already marked delivered
        await client.query("ROLLBACK");
        return null;
      }

      const cpId = cpUpdate.rows[0].customerpaymentid;

      // 2. Update all linked orders to complete/delivered
      await client.query(
        `
        UPDATE orders o
        SET status = 'completed', updatedat = CURRENT_TIMESTAMP
        FROM customerpayment_orders cpo
        WHERE o.orderid = cpo.orderid
          AND cpo.customerpaymentid = $1
          AND o.status != 'completed'
        `,
        [cpId]
      );

      await client.query("COMMIT");
      return cpId;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async updateEstimatedDeliveryByTracking(tracking_number, estimated_date) {
    if (!estimated_date) return false;
    try {
      const result = await pool.query(
        `UPDATE customerpayment
         SET estimated_delivery_date = $2
         WHERE tracking_number = $1
         RETURNING customerpaymentid`,
        [tracking_number, estimated_date]
      );
      return result.rowCount > 0;
    } catch (err) {
      console.error("Error updating estimated_delivery_date:", err.message);
      return false;
    }

  }
}
