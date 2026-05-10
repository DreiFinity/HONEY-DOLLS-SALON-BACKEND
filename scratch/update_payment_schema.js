import pkg from "pg";
const { Pool } = pkg;
import { config } from "./src/config/env.js";

const pool = new Pool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
});

async function updateSupplierPaymentSchema() {
  try {
    console.log("Updating supplierpayment table schema...");
    
    const columnsToAdd = [
      { name: 'reference_code', type: 'TEXT' },
      { name: 'payment_type', type: 'TEXT', default: "'IMMEDIATE'" },
      { name: 'payment_term_days', type: 'INTEGER', default: '0' },
      { name: 'downpayment', type: 'NUMERIC(12,2)', default: '0.00' }
    ];

    for (const col of columnsToAdd) {
      const check = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='supplierpayment' AND column_name=$1;
      `, [col.name]);

      if (check.rowCount === 0) {
        console.log(`Adding ${col.name} to supplierpayment...`);
        const defaultClause = col.default ? `DEFAULT ${col.default}` : "";
        await pool.query(`ALTER TABLE supplierpayment ADD COLUMN ${col.name} ${col.type} ${defaultClause};`);
      }
    }

    // Optional: Drop from supplierpurchase if user wants
    const checkRef = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='supplierpurchase' AND column_name='reference_code';
    `);
    if (checkRef.rowCount > 0) {
      console.log("Dropping reference_code from supplierpurchase...");
      await pool.query("ALTER TABLE supplierpurchase DROP COLUMN reference_code;");
    }

    console.log("Schema update completed successfully.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await pool.end();
  }
}

updateSupplierPaymentSchema();
