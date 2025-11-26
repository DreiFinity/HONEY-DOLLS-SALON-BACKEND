export default class ProductRepository {
  constructor(ProductModel) {
    this.ProductModel = ProductModel;
  }

  async getAll() {
    return await this.ProductModel.findAll();
  }

  async create(productData) {
    return await this.ProductModel.create(productData);
  }
  async update(productId, productData) {
    throw new Error("Method not implemented");
  }

  async delete(productId) {
    throw new Error("Method not implemented");
  }
}
