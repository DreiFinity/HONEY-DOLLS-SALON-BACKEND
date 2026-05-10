import { pool } from "../../db/index.js";

const generateRefCode = (prefix) => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export default class ProductAdjustmentsRepositoryImpl {

  // ─── FETCH ALL (unified table) ──────────────────────────────────────────────
  async getAll() {
    const query = `
      SELECT
        pa.type,
        pa.adjustmentid AS id,
        p.prodname AS product,
        p.productid,
        pa.userid,
        COALESCE(
          s.firstname || ' ' || s.lastname,
          a.firstname || ' ' || a.lastname,
          c.firstname || ' ' || c.lastname,
          u.username
        ) AS staff,
        pa.quantity,
        pa.reason,
        pa.remarks,
        pa.datetime,
        pa.branchid,
        pa.reference_code,
        b.branchname
      FROM product_adjustments pa
      LEFT JOIN products  p ON pa.productid = p.productid
      LEFT JOIN users     u ON pa.userid    = u.userid
      LEFT JOIN staff     s ON s.userid     = u.userid
      LEFT JOIN admin     a ON a.userid     = u.userid
      LEFT JOIN customers c ON c.userid     = u.userid
      LEFT JOIN branch    b ON pa.branchid  = b.branchid
      ORDER BY pa.datetime DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ─── WASTE ──────────────────────────────────────────────────────────────────
  async createWaste({ productid, userid, reason, remarks, branchid }) {
    const refCode = generateRefCode('WASTE');
    const query = `
      INSERT INTO product_adjustments (type, productid, userid, reason, remarks, branchid, datetime, reference_code)
      VALUES ('Waste', $1, $2, $3, $4, $5, NOW(), $6)
      RETURNING adjustmentid AS wasteid, *
    `;
    const result = await pool.query(query, [productid, userid, reason, remarks, branchid, refCode]);
    return result.rows[0];
  }

  async deleteWaste(wasteid) {
    await pool.query("DELETE FROM product_adjustments WHERE adjustmentid = $1 AND type = 'Waste'", [wasteid]);
    return true;
  }

  // ─── USAGE ──────────────────────────────────────────────────────────────────
  async createUsage({ productid, userid, quantity, reason, remarks, branchid }) {
    const refCode = generateRefCode('USE');
    const query = `
      INSERT INTO product_adjustments (type, productid, userid, quantity, reason, remarks, branchid, datetime, reference_code)
      VALUES ('Usage', $1, $2, $3, $4, $5, $6, NOW(), $7)
      RETURNING adjustmentid AS usageid, *
    `;
    const result = await pool.query(query, [productid, userid, quantity, reason, remarks, branchid, refCode]);
    return result.rows[0];
  }

  async deleteUsage(usageid) {
    await pool.query("DELETE FROM product_adjustments WHERE adjustmentid = $1 AND type = 'Usage'", [usageid]);
    return true;
  }

  // ─── DAMAGE ─────────────────────────────────────────────────────────────────
  async createDamage({ productid, userid, reason, remarks, branchid }) {
    const refCode = generateRefCode('DMG');
    const query = `
      INSERT INTO product_adjustments (type, productid, userid, reason, remarks, branchid, datetime, reference_code)
      VALUES ('Damage', $1, $2, $3, $4, $5, NOW(), $6)
      RETURNING adjustmentid AS damageid, *
    `;
    const result = await pool.query(query, [productid, userid, reason, remarks, branchid, refCode]);
    return result.rows[0];
  }

  async deleteDamage(damageid) {
    await pool.query("DELETE FROM product_adjustments WHERE adjustmentid = $1 AND type = 'Damage'", [damageid]);
    return true;
  }
}
