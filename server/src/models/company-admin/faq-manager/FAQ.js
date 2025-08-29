const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FAQ = sequelize.define('FAQ', {
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
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  searchKeywords: {
    type: DataTypes.JSON,
    defaultValue: [],
    field: 'search_keywords'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  helpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'helpful_count'
  },
  notHelpfulCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'not_helpful_count'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'faqs',
  timestamps: true,
  indexes: [
    {
      fields: ['company_id', 'category']
    },
    {
      fields: ['company_id', 'is_active']
    },
    {
      fields: ['company_id', 'order']
    }
  ]
});

module.exports = FAQ;
