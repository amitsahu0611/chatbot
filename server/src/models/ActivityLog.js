const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: {
    type: DataTypes.ENUM(
      'company_registered',
      'user_created',
      'user_updated',
      'user_deleted',
      'subscription_upgraded',
      'subscription_downgraded',
      'lead_created',
      'lead_updated',
      'form_submitted',
      'faq_created',
      'widget_created',
      'login',
      'logout',
      'system_action'
    ),
    allowNull: false
  },
  entityType: {
    type: DataTypes.ENUM('user', 'company', 'lead', 'form', 'faq', 'widget', 'system'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'activity_logs',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['entityType']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['companyId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

module.exports = ActivityLog;
