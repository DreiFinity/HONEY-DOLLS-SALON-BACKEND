export const mapPaymentImages = (customerPayments) =>
  (customerPayments || []).map((payment) => ({
    ...payment,
    orders: (payment.orders || []).map((order) => ({
      ...order,
      items: (order.items || []).map((p) => ({
        ...p,
        prodimage: p.prodimage ? `http://localhost:3000/api/uploads/${p.prodimage}` : null,
      })),
    })),
  }));
