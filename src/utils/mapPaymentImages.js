const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export const mapPaymentImages = (customerPayments) =>
  (customerPayments || []).map((payment) => ({
    ...payment,
    orders: (payment.orders || []).map((order) => ({
      ...order,
      items: (order.items || []).map((p) => ({
        ...p,
        prodimage: p.prodimage 
          ? (p.prodimage.startsWith('http') ? p.prodimage : `${BASE_URL}/api/uploads/${p.prodimage}`)
          : null,
      })),
    })),
  }));

