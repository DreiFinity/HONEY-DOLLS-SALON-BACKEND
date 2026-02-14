const { DataTypes } = require('sequelize');
const sequelize = require('../index'); // your sequelize instance

const Product = sequelize.define('Product', {
  productid: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  prodname: {
    type: DataTypes.STRING,
    allowNull: false
  },
  prodcat: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10,2)
  },
  prodimage: {
    type: DataTypes.STRING
  },
  createdat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'products',
  timestamps: false
});

module.exports = Product;
