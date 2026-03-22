import { DataTypes } from "sequelize";
import sequelize from "../index.js";

const CustomerAddressModel = sequelize.define(
  "CustomerAddress",
  {
    addressid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customerid: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    street: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    barangay: DataTypes.STRING,
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    province: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    postal_code: DataTypes.STRING,
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: DataTypes.DATE,
  },
  {
    tableName: "customer_addresses",
    timestamps: false,
  },
);

export default CustomerAddressModel;
