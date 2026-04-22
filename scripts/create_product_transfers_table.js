// scripts/create_product_transfers_table.js
import { pool } from "../src/infrastructure/db/index.js";

const dropTableQuery = `DROP TABLE IF EXISTS product_transfers;`;

const createTableQuery = `
CREATE TABLE product_transfers (
    transferid SERIAL PRIMARY KEY,
    productid INT NOT NULL,
    from_branchid INT NOT NULL,
    to_branchid INT NOT NULL,
    quantity INT NOT NULL,
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    adminid INT,
    remarks TEXT,
    FOREIGN KEY (productid) REFERENCES products(productid),
    FOREIGN KEY (from_branchid) REFERENCES branch(branchid),
    FOREIGN KEY (to_branchid) REFERENCES branch(branchid),
    FOREIGN KEY (adminid) REFERENCES admin(adminid)
);
`;

async function createTable() {
  try {
    console.log("Connected to PostgreSQL");
    await pool.query(dropTableQuery);
    await pool.query(createTableQuery);
    console.log("Table 'product_transfers' recreated with adminid.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating table:", err);
    process.exit(1);
  }
}

createTable();
