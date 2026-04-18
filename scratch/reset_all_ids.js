import { pool } from '../src/infrastructure/db/index.js';

async function resetSequences() {
  try {
    console.log("Resetting database ID sequences to 1...");

    // List of common sequences in your project
    const sequences = [
      'appointment_appointmentid_seq',
      'queue_queueid_seq',
      'reservationpayment_reservationpaymentid_seq',
      'customers_customerid_seq',
      'users_userid_seq',
      'staff_staffid_seq',
      'service_serviceid_seq'
    ];

    for (const seq of sequences) {
      try {
        await pool.query(`ALTER SEQUENCE ${seq} RESTART WITH 1`);
        console.log(`✅ Reset successful: ${seq}`);
      } catch (err) {
        console.log(`⚠️  Skipped ${seq}: ${err.message}`);
      }
    }

    console.log("\nAll sequences reset! Your next entries will start at #1.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    process.exit();
  }
}

resetSequences();
