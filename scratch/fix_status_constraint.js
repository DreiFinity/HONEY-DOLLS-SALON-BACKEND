import { pool } from '../src/infrastructure/db/index.js';

async function fixConstraint() {
  try {
    console.log("Updating appointment_status_check constraint...");
    
    // First drop the old one
    await pool.query(`ALTER TABLE appointment DROP CONSTRAINT IF EXISTS appointment_status_check`);
    
    // Add the new one including 'paid'
    await pool.query(`
      ALTER TABLE appointment 
      ADD CONSTRAINT appointment_status_check 
      CHECK (status IN ('pending', 'paid', 'confirmed', 'completed', 'cancelled'))
    `);
    
    console.log("✅ Constraint updated successfully! The 'paid' status is now allowed.");
  } catch (err) {
    console.error("❌ Error updating constraint:", err.message);
  } finally {
    process.exit();
  }
}

fixConstraint();
