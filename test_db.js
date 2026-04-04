import db from "./src/infrastructure/db/index.js";
try {
  const table = 'supplierpayment';
  const res = await db.pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1", [table]);
  console.log(`Structure of ${table}:`);
  res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
} catch (e) {
  console.error("ERROR:", e.message);
} finally {
  process.exit();
}
