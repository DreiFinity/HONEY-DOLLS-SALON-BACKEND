import { pool } from '../src/infrastructure/db/index.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

async function test() {
  const tokenWithoutLoginId = jwt.sign(
    { id: 10, role: 'customer' },
    config.jwtSecret,
    { expiresIn: "24h" }
  );

  const tokenWithLoginId = jwt.sign(
    { id: 10, role: 'customer', login_id: 'e05f24f2-c49d-4f6f-a7ec-19ad177a700e' },
    config.jwtSecret,
    { expiresIn: "24h" }
  );

  console.log("Token without login_id:\n" + tokenWithoutLoginId);
  console.log("Token with login_id:\n" + tokenWithLoginId);
  process.exit();
}

test();
