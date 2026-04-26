export default class SalesController {
  constructor(salesRepository) {
    this.salesRepository = salesRepository;
  }

  async getStats(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const [dailyStats, chartData, topProducts, orderStats, salesRecords] = await Promise.all([
        this.salesRepository.getDailyStats(),
        this.salesRepository.getSalesChartData(days),
        this.salesRepository.getTopProducts(6),
        this.salesRepository.getOrderStats(days),
        this.salesRepository.getSalesRecords()
      ]);

      return res.json({
        success: true,
        data: {
          dailyStats,
          chartData,
          topProducts,
          orderStats,
          salesRecords
        }
      });
    } catch (err) {
      console.error("Sales Controller Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  async getDashboardSummary(req, res) {
    try {
      const stats = await this.salesRepository.getDashboardStats();
      return res.json({ success: true, data: stats });
    } catch (err) {
      console.error("Dashboard Summary Error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
