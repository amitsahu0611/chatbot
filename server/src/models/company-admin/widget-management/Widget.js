const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Widget = sequelize.define('Widget', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Widget name'
  },
  type: {
    type: DataTypes.ENUM('chat', 'form'),
    allowNull: false,
    defaultValue: 'chat',
    comment: 'Widget type (chat or form)'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'draft'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Widget status'
  },
  domain: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Domain where widget is allowed to run'
  },
  widgetId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'Unique widget identifier'
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      theme: 'light',
      position: 'bottom-right',
      primaryColor: '#3b82f6',
      welcomeMessage: 'Hello! How can I help you today?',
      showAgentAvatar: true,
      showAgentName: true,
      autoOpen: false,
      autoOpenDelay: 5000,
      hideWhenOffline: false
    },
    comment: 'Widget configuration settings'
  },
  stats: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      totalInteractions: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      totalSubmissions: 0
    },
    comment: 'Widget statistics'
  },
  embedCode: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Generated embed code for the widget'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the widget is active'
  }
}, {
  tableName: 'widgets',
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['widgetId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = Widget;
