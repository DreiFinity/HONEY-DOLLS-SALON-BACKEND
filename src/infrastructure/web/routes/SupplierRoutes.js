import { pool } from "../../db/index.js";

const SupplierRoutes = (express) => {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT supplierid, suppliername FROM supplier ORDER BY suppliername");
      res.json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};

export default SupplierRoutes;
