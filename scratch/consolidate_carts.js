import { pool } from "../src/infrastructure/db/index.js";

async function consolidateCarts() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // Find all customers with multiple pending orders
    const res = await client.query(`
      SELECT customerid, array_agg(orderid) as orderids
      FROM orders
      WHERE status = 'pending'
      GROUP BY customerid
    `);

    for (const row of res.rows) {
      if (row.orderids.length > 1) {
        const primaryOrderId = row.orderids[0];
        const secondaryOrderIds = row.orderids.slice(1);
        
        // Move all orderdetails from secondary orders to the primary order
        for (const secOrderId of secondaryOrderIds) {
          // get details
          const detailsRes = await client.query(
            "SELECT * FROM orderdetails WHERE orderid = $1", [secOrderId]
          );
          
          for (const detail of detailsRes.rows) {
            // Check if product already exists in primary order
            const existingRes = await client.query(
              "SELECT orderdetailsid FROM orderdetails WHERE orderid = $1 AND productid = $2",
              [primaryOrderId, detail.productid]
            );
            
            if (existingRes.rows.length > 0) {
              await client.query(
                "UPDATE orderdetails SET quantity = quantity + $1 WHERE orderdetailsid = $2",
                [detail.quantity, existingRes.rows[0].orderdetailsid]
              );
              // delete the duplicate row
              await client.query("DELETE FROM orderdetails WHERE orderdetailsid = $1", [detail.orderdetailsid]);
            } else {
              // just update the orderid
              await client.query(
                "UPDATE orderdetails SET orderid = $1 WHERE orderdetailsid = $2",
                [primaryOrderId, detail.orderdetailsid]
              );
            }
          }
          
          // delete the empty secondary order
          await client.query("DELETE FROM orders WHERE orderid = $1", [secOrderId]);
        }
      }
      // even if there's only 1 order, we should merge duplicate products in orderdetails
      const primaryOrderId = row.orderids[0];
      const detailsRes = await client.query(
          "SELECT productid, SUM(quantity) as qty, MIN(orderdetailsid) as keep_id FROM orderdetails WHERE orderid = $1 GROUP BY productid",
          [primaryOrderId]
      );
      for(const detail of detailsRes.rows) {
          await client.query("UPDATE orderdetails SET quantity = $1 WHERE orderdetailsid = $2", [detail.qty, detail.keep_id]);
          await client.query("DELETE FROM orderdetails WHERE orderid = $1 AND productid = $2 AND orderdetailsid != $3", [primaryOrderId, detail.productid, detail.keep_id]);
      }
    }
    await client.query("COMMIT");
    console.log("Consolidation complete.");
  } catch(e) {
    await client.query("ROLLBACK");
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}
consolidateCarts();
