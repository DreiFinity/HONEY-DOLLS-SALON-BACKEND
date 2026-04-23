import ReservationPaymentRepositoryImpl from '../src/infrastructure/repositories/Payment/ReservationPaymentRepositoryImpl.js';
import dotenv from 'dotenv';
dotenv.config();

const repo = new ReservationPaymentRepositoryImpl();

async function test() {
  try {
    const data = await repo.getAll();
    console.log('First row service names:', data[0]?.service_names);
    console.log('Full first row:', JSON.stringify(data[0], null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
