// src/infrastructure/controllers/ProductController.js
export default class ProductController {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  async getAll(req, res) {
    try {
      const products = await this.productRepository.getAll();
      return res.json({ products });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req, res) {
    try {
      const { prodname, prodcat, price } = req.body;
      if (!prodname || !prodcat || !price) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const prodimage = req.file ? req.file.filename : null;

      const newProduct = await this.productRepository.create({
        prodname,
        prodcat,
        price: parseFloat(price),
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
        error: error.message,
      });
    }
  }
  async update(req, res) {
    try {
      const productId = parseInt(req.params.id);
      const { prodname, prodcat, price } = req.body;
      if (!prodname || !prodcat || !price)
        return res.status(400).json({ message: "All fields are required" });

      const prodimage = req.file ? req.file.filename : null;

      const updatedProduct = await this.productRepository.update(productId, {
        prodname,
        prodcat,
        price: parseFloat(price),
        prodimage,
      });

      return res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to update product",
        error: error.message,
      });
    }
  }

  async delete(req, res) {
    try {
      const productId = parseInt(req.params.id);

      const deletedProduct = await this.productRepository.delete(productId);

      if (!deletedProduct)
        return res.status(404).json({ message: "Product not found" });

      return res.status(200).json({
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Failed to delete product",
        error: error.message,
      });
    }
  }
}
