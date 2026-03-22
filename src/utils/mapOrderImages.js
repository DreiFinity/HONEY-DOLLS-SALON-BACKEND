// utils/mapOrderImages.js
export const mapOrderImages = (orders) =>
  orders.map((order) => ({
    ...order,
    products: order.products.map((p) => ({
      ...p,
      prodimage: `http://localhost:3000/api/uploads/${p.prodimage}`, // full URL to static folder
    })),
  }));
