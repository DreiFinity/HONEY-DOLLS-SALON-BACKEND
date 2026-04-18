import fs from "fs";
import { pool } from "./src/infrastructure/db/index.js";

async function scan() {
  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name LIKE 'product%'
      ORDER BY table_name, ordinal_position;
    `);

    // Also get foreign key constraints
    const fks = await pool.query(`
      SELECT
        tc.table_name, kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name IN ('productwaste', 'productusage', 'product_damage');
    `);
    
    fs.writeFileSync("db_scan.json", JSON.stringify({ columns: res.rows, foreign_keys: fks.rows }, null, 2));
    console.log("Written to db_scan.json");

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

scan();
