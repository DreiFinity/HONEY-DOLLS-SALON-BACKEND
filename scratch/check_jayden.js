import { pool } from "../src/infrastructure/db/index.js";

async function checkRoles() {
  try {
    const { rows } = await pool.query("SELECT s.firstname, s.lastname, s.role AS staff_role, u.role AS user_role FROM staff s JOIN users u ON s.userid = u.userid WHERE s.firstname ILIKE '%Jayden%'");
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err.message);
  } finally {
    process.exit(0);
  }
}
checkRoles();
