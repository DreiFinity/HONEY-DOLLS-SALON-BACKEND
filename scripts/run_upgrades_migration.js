import { pool } from "../src/infrastructure/db/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    console.log("Starting migrations...");

    // 1. Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR PRIMARY KEY,
        value VARCHAR NOT NULL
      );
    `);
    console.log("✅ Created 'settings' table (if not exists)");

    // 2. Insert default settings
    await pool.query(`
      INSERT INTO settings (key, value) VALUES 
        ('downpayment_percentage', '25'),
        ('max_delivery_weight', '20')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log("✅ Populated default settings");

    // 3. Add arrival_date column to supplierpurchase
    await pool.query(`
      ALTER TABLE supplierpurchase 
      ADD COLUMN IF NOT EXISTS arrival_date TIMESTAMP WITH TIME ZONE NULL;
    `);
    console.log("✅ Added 'arrival_date' column to 'supplierpurchase' table");

    // 4. Run settlements tables migration
    const settlementsSqlPath = path.resolve(__dirname, "../migrations/create_settlements_tables.sql");
    if (fs.existsSync(settlementsSqlPath)) {
      console.log("Reading settlements SQL migration...");
      const sql = fs.readFileSync(settlementsSqlPath, "utf8");
      await pool.query(sql);
      console.log("✅ Executed settlements tables SQL migration successfully");
    } else {
      console.warn("⚠️ Warning: migrations/create_settlements_tables.sql file not found");
    }

    // 5. Add columns to supplierpayment
    await pool.query(`
      ALTER TABLE supplierpayment 
      ADD COLUMN IF NOT EXISTS reference_code TEXT,
      ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'IMMEDIATE',
      ADD COLUMN IF NOT EXISTS payment_term_days INTEGER DEFAULT 0;
    `);
    console.log("✅ Added reference_code, payment_type, and payment_term_days columns to 'supplierpayment' table");

    // 6. Add UNIQUE constraint to paymongo_id in supplierpayment
    const checkUniquePaymongo = await pool.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'supplierpayment'::regclass AND conname = 'supplierpayment_paymongo_id_key';
    `);
    if (checkUniquePaymongo.rowCount === 0) {
      await pool.query("ALTER TABLE supplierpayment ADD CONSTRAINT supplierpayment_paymongo_id_key UNIQUE (paymongo_id);");
      console.log("✅ Added UNIQUE constraint on 'paymongo_id' in 'supplierpayment' table");
    } else {
      console.log("✅ UNIQUE constraint on 'paymongo_id' in 'supplierpayment' already exists");
    }

    console.log("Migrations finished successfully.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit();
  }
}
run();
