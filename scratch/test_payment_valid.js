import { pool } from '../src/infrastructure/db/index.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

async function test() {
  try {
    // 1. Get an appointment
    const apptRes = await pool.query('SELECT * FROM appointment ORDER BY appointmentid DESC LIMIT 1');
    const appointment = apptRes.rows[0];
    if (!appointment) throw new Error("No appointment found in database");
    
    // 2. Get the customer for this appointment
    const customerRes = await pool.query('SELECT * FROM customers WHERE customerid = $1', [appointment.customerid]);
    const customer = customerRes.rows[0];
    if (!customer) throw new Error("Customer not found for appointment");
    
    // 3. Setup a valid session
    const loginId = uuidv4();
    await pool.query(
      `INSERT INTO active_sessions(user_id, login_id, last_route) VALUES($1, $2, '/dashboard')
       ON CONFLICT (user_id) DO UPDATE SET login_id = $2`,
      [customer.userid, loginId]
    );

    // Create a VALID token matching the session
    const token = jwt.sign({ id: customer.userid, role: 'customer', login_id: loginId }, 'supersecretkey123');
    
    console.log("Testing with appointment:", appointment.appointmentid, "for customer:", customer.customerid);
    
    // 4. Make the API request
    const response = await axios.post('http://localhost:3000/api/reservation-payment/create', 
      { appointmentid: appointment.appointmentid },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log("Success! Checkout URL:", response.data.checkout_url);
  } catch (err) {
    console.error("API Error:", err.response ? err.response.data : err.message);
  } finally {
    process.exit();
  }
}

test();
