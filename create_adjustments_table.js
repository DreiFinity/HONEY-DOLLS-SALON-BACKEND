import { pool } from "./src/infrastructure/db/index.js";

async function execute() {
  try {
    // 1. Create table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_adjustments (
        adjustmentid SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Usage', 'Waste', 'Damage')),
        productid INTEGER REFERENCES products(productid) ON DELETE CASCADE,
        userid INTEGER REFERENCES users(userid) ON DELETE SET NULL,
        quantity INTEGER,
        reason VARCHAR(255),
        remarks TEXT,
        datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Created table 'product_adjustments'");

    // 2. Try migrating product_damage (this table exists and has correct columns)
    try {
      const { rowCount } = await pool.query(`
        INSERT INTO product_adjustments (type, productid, userid, quantity, reason, remarks, datetime)
        SELECT 'Damage', productid, userid, NULL, reason, remarks, datetime 
        FROM product_damage
        WHERE damageid NOT IN (
          SELECT adjustmentid FROM product_adjustments WHERE type='Damage'
        )
      `);
      console.log(`Migrated ${rowCount} rows from product_damage`);
    } catch (e) {
      console.log("Migrating product_damage failed or returned 0 rows.");
    }

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

execute();
