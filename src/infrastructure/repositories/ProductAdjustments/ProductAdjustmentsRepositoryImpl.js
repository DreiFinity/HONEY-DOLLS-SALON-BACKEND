// src/infrastructure/repositories/ProductAdjustments/ProductAdjustmentsRepositoryImpl.js
import { pool } from "../../db/index.js";

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
        pa.datetime
      FROM product_adjustments pa
      LEFT JOIN products  p ON pa.productid = p.productid
      LEFT JOIN users     u ON pa.userid    = u.userid
      LEFT JOIN staff     s ON s.userid     = u.userid
      LEFT JOIN admin     a ON a.userid     = u.userid
      LEFT JOIN customers c ON c.userid     = u.userid
      ORDER BY pa.datetime DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // ─── WASTE ──────────────────────────────────────────────────────────────────
  async createWaste({ productid, userid, reason, remarks }) {
    const query = `
      INSERT INTO product_adjustments (type, productid, userid, reason, remarks, datetime)
      VALUES ('Waste', $1, $2, $3, $4, NOW())
      RETURNING adjustmentid AS wasteid, *
    `;
    const result = await pool.query(query, [productid, userid, reason, remarks]);
    return result.rows[0];
  }

  async deleteWaste(wasteid) {
    await pool.query("DELETE FROM product_adjustments WHERE adjustmentid = $1 AND type = 'Waste'", [wasteid]);
    return true;
  }

  // ─── USAGE ──────────────────────────────────────────────────────────────────
  async createUsage({ productid, userid, quantity, reason, remarks }) {
    const query = `
      INSERT INTO product_adjustments (type, productid, userid, quantity, reason, remarks, datetime)
      VALUES ('Usage', $1, $2, $3, $4, $5, NOW())
      RETURNING adjustmentid AS usageid, *
    `;
    const result = await pool.query(query, [productid, userid, quantity, reason, remarks]);
    return result.rows[0];
  }

  async deleteUsage(usageid) {
    await pool.query("DELETE FROM product_adjustments WHERE adjustmentid = $1 AND type = 'Usage'", [usageid]);
    return true;
  }

  // ─── DAMAGE ─────────────────────────────────────────────────────────────────
  async createDamage({ productid, userid, reason, remarks }) {
    const query = `
      INSERT INTO product_adjustments (type, productid, userid, reason, remarks, datetime)
      VALUES ('Damage', $1, $2, $3, $4, NOW())
      RETURNING adjustmentid AS damageid, *
    `;
    const result = await pool.query(query, [productid, userid, reason, remarks]);
    return result.rows[0];
  }

  async deleteDamage(damageid) {
    await pool.query("DELETE FROM product_adjustments WHERE adjustmentid = $1 AND type = 'Damage'", [damageid]);
    return true;
  }
}
