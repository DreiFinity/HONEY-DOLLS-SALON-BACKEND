import OnlineOrderRepositoryImpl from "../../../infrastructure/repositories/Order/OnlineOrderRepositoryImpl.js";
// Correct import
import { pool } from "../../../infrastructure/db/index.js";
import { mapOrderImages } from "../../../utils/mapOrderImages.js";

const onlineOrderRepo = new OnlineOrderRepositoryImpl();

export const createOnlineOrder = async (req, res) => {
  try {
    const userId = req.user.id; // JWT ensures customer role

    // 1️⃣ Get customerid from customers table
    const customerRes = await pool.query(
      "SELECT customerid FROM customers WHERE userid = $1",
      [userId],
    );

    if (!customerRes.rows[0]) {
      return res.status(400).json({
        success: false,
        message: "No customer profile found for this user",
      });
    }

    const customerid = customerRes.rows[0].customerid;

    // 2️⃣ Prepare order data
    const orderData = {
      ...req.body,
      customerid,
    };

    // 3️⃣ Validate products array exists and is an array
    if (
      !orderData.products ||
      !Array.isArray(orderData.products) ||
      orderData.products.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Products must be a non-empty array",
      });
    }

    // 4️⃣ Optional: Check that all product IDs exist in products table
    const productIds = orderData.products.map((p) => p.productid);
    const productCheck = await pool.query(
      "SELECT productid FROM products WHERE productid = ANY($1)",
      [productIds],
    );
    const existingIds = productCheck.rows.map((r) => r.productid);
    const missingIds = productIds.filter((id) => !existingIds.includes(id));
    if (missingIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid product IDs: ${missingIds.join(", ")}`,
      });
    }

    // 5️⃣ Estimate delivery date
    let transit_days = 2;
    const city = orderData.shipping_city?.toLowerCase();
    if (city === "cebu") transit_days = 3;
    else if (city === "davao") transit_days = 5;

    const buffer = 1;
    const estimated_delivery_date = new Date();
    estimated_delivery_date.setDate(
      estimated_delivery_date.getDate() + transit_days + buffer,
    );
    orderData.estimated_delivery_date = estimated_delivery_date;

    // 6️⃣ Create order and order details
    const order = await onlineOrderRepo.create(orderData);

    return res.status(201).json({ success: true, order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getCustomerOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const customerRes = await pool.query(
      "SELECT customerid FROM customers WHERE userid = $1",
      [userId],
    );

    if (!customerRes.rows[0]) {
      return res.status(400).json({
        success: false,
        message: "No customer profile found for this user",
      });
    }

    const customerId = customerRes.rows[0].customerid;

    // ✅ Fetch pending orders
    const orders = await onlineOrderRepo.getPendingOrdersByCustomer(customerId);

    // ✅ Map images for products
    const ordersWithImages = mapOrderImages(orders);

    return res.json({ success: true, orders: ordersWithImages });
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// READ ONE order
export const getOnlineOrderById = async (req, res) => {
  try {
    const order = await onlineOrderRepo.findById(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch order" });
  }
};

// UPDATE order
export const updateOnlineOrder = async (req, res) => {
  try {
    const order = await onlineOrderRepo.update(req.params.id, req.body);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update order" });
  }
};

// UPDATE order quantity
export const updateOnlineOrderQuantity = async (req, res) => {
  try {
    const { productid, quantity } = req.body;
    
    if (!productid || quantity === undefined) {
      return res.status(400).json({ success: false, message: "productid and quantity are required" });
    }

    const updatedDetail = await onlineOrderRepo.updateQuantity(req.params.id, productid, quantity);
    if (!updatedDetail) {
      return res.status(404).json({ success: false, message: "Product not found in this order" });
    }
    res.status(200).json({ success: true, updatedDetail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update quantity" });
  }
};

// DELETE order
export const deleteOnlineOrder = async (req, res) => {
  try {
    const order = await onlineOrderRepo.delete(req.params.id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, message: "Order deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to delete order" });
  }
};
