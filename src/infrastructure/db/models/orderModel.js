import { DataTypes } from "sequelize";
import sequelize from "../index.js";

const Order = sequelize.define(
  "Order",
  {
    orderid: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customerid: { type: DataTypes.INTEGER, allowNull: false },
    order_channel: { type: DataTypes.STRING, defaultValue: "online" },
    status: { type: DataTypes.STRING, defaultValue: "pending" },
    total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    shipping_street: { type: DataTypes.TEXT },
    shipping_barangay: { type: DataTypes.STRING },
    shipping_city: { type: DataTypes.STRING },
    shipping_province: { type: DataTypes.STRING },
    shipping_postal_code: { type: DataTypes.STRING },
    courier_name: { type: DataTypes.STRING },
    estimated_delivery_date: { type: DataTypes.DATE },
    shipped_at: { type: DataTypes.DATE },
    delivered_at: { type: DataTypes.DATE },
    createdat: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedat: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "orders",
    timestamps: false,
  },
);

export default Order;
