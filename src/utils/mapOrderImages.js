// utils/mapOrderImages.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export const mapOrderImages = (orders) =>
  orders.map((order) => ({
    ...order,
    products: order.products.map((p) => ({
      ...p,
      prodimage: p.prodimage 
        ? (p.prodimage.startsWith('http') ? p.prodimage : `${BASE_URL}/api/uploads/${p.prodimage}`)
        : p.prodimage,
    })),
  }));

