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
}
