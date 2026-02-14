import { pool } from "../../db/index.js";
import CustomerPaymentRepository from "../../../domain/repositories/Payment/CustomerPaymentRepository.js";

export default class CustomerPaymentRepositoryImpl extends CustomerPaymentRepository {
  async createPayment(paymentData) {
    const { orderid, reference_code, partialamountpaid, method } = paymentData;

    const query = `
      INSERT INTO customerpayment (orderid, reference_code, partialamountpaid, method)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [orderid, reference_code, partialamountpaid, method];

    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
