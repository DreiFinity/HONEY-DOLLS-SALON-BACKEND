import { pool } from "../../db/index.js";

export default class ReturnRepositoryImpl {
  async createReturnRequest(returnData) {
    const { orderid, customerid, productid, quantity, reason, reason_type, status, customer_evidence_image } = returnData;

    console.log(`Checking order ${orderid} for customer ${customerid}`);

    // Check if the order exists and is completed
    const orderCheck = await pool.query(
      "SELECT status, customerid FROM orders WHERE orderid = $1",
      [orderid]
    );

    if (orderCheck.rows.length === 0) {
      console.log(`Order ${orderid} not found at all.`);
      throw new Error("Order not found");
    }

    const orderRecord = orderCheck.rows[0];
    if (orderRecord.customerid != customerid) {
      console.log(`OWNERSHIP ERROR: Order ${orderid} is owned by ${orderRecord.customerid}, but request is for ${customerid}`);
      throw new Error(`Order ownership mismatch (Order:${orderid} RequestCust:${customerid})`);
    }

    const orderStatus = orderRecord.status;
    if (orderStatus !== 'completed' && orderStatus !== 'delivered') {
      throw new Error(`Only completed or delivered orders can be returned. Current order status: ${orderStatus}`);
    }

    const query = `
      INSERT INTO product_returns (
        orderid, customerid, productid, quantity, reason, reason_type, status, customer_evidence_image, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `;
    const values = [orderid, customerid, productid, quantity, reason, reason_type || 'others', status || 'pending', customer_evidence_image];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async getReturnsByCustomer(customerid) {
    const query = `
      SELECT r.*, p.prodname, p.prodimage, o.createdat as order_date
      FROM product_returns r
      JOIN products p ON r.productid = p.productid
      JOIN orders o ON r.orderid = o.orderid
      WHERE r.customerid = $1
      ORDER BY r.createdat DESC
    `;
    const { rows } = await pool.query(query, [customerid]);
    return rows;
  }

  async getAllReturns() {
    const query = `
      SELECT r.*, p.prodname, p.prodimage, c.firstname, c.lastname, 
             cp.reference_code, cp.customerpaymentid
      FROM product_returns r
      JOIN products p ON r.productid = p.productid
      JOIN customers c ON r.customerid = c.customerid
      LEFT JOIN customerpayment_orders cpo ON r.orderid = cpo.orderid
      LEFT JOIN customerpayment cp ON cp.customerpaymentid = cpo.customerpaymentid
      ORDER BY r.createdat DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async updateReturnStatus(returnid, status) {
    const query = "UPDATE product_returns SET status = $1, updated_at = NOW() WHERE returnid = $2 RETURNING *";
    const { rows } = await pool.query(query, [status, returnid]);

    if (status === 'completed') {
      const returnRecord = rows[0];
      await pool.query(
        "UPDATE products SET quantity = quantity + $1 WHERE productid = $2",
        [returnRecord.quantity, returnRecord.productid]
      ).catch(err => console.log("Inventory update failed:", err.message));
    }

    return rows[0];
  }

  async processReturnRefund(returnid, refundProof) {
    const updateQuery = `
      UPDATE product_returns 
      SET refund_proof = $1, 
          refund_at = NOW(),
          updated_at = NOW()
      WHERE returnid = $2
      RETURNING *
    `;
    const { rows } = await pool.query(updateQuery, [refundProof, returnid]);
    return rows[0];
  }
}
