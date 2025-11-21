// src/interfaces/controllers/Service/ServiceController.js
export default class ProductController {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async getAll(req, res) {
    try {
      const products = await this.productRepository.getAllProducts();
      return res.json({ products });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}
