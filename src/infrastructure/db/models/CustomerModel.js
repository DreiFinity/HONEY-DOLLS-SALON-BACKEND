import { DataTypes } from "sequelize";
import sequelize from "../index.js";

const CustomerModel = sequelize.define(
  "customers",
  {
    customerid: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    firstname: DataTypes.TEXT,
    lastname: DataTypes.TEXT,
    contact: DataTypes.STRING,
    userid: DataTypes.INTEGER,
  },
  {
    tableName: "customers",
    timestamps: false,
  },
);

export default CustomerModel;
