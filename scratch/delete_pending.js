import { pool } from "../src/infrastructure/db/index.js";
pool.query("DELETE FROM orders WHERE status = 'pending'").then(() => { console.log('Deleted pending orders'); process.exit(0); });
