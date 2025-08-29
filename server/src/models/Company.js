const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
    defaultValue: 'free'
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    defaultValue: 'active'
  },
  subscriptionExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  maxConversations: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'companies'
});

module.exports = Company;
