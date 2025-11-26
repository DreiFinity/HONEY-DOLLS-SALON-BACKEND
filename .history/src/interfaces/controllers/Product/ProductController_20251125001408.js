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

  async create(req, res) {
    try {
      const { prodname, prodcat, price } = req.body;
      const prodimage = req.file ? req.file.filename : null;

      const newProduct = await this.productRepository.create({
        prodname,
        prodcat,
        price,
        prodimage,
      });

      return res.status(201).json({
        message: "Product created successfully",
        product: newProduct,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to create product",
        error,
      });
    }
  }
}
