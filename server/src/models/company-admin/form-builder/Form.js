const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Form = sequelize.define('Form', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Form configuration
  fields: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: []
  },
  // Form settings
  settings: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {
      submitButtonText: 'Submit',
      successMessage: 'Thank you! Your submission has been received.',
      redirectUrl: '',
      emailNotifications: {
        enabled: false,
        recipients: []
      },
      leadGeneration: {
        enabled: true,
        createLeadOnSubmit: true,
        leadSource: 'Website Form'
      }
    }
  },
  // Form status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Form metadata
  formType: {
    type: DataTypes.ENUM('contact', 'support', 'lead', 'custom'),
    defaultValue: 'custom'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Analytics
  totalSubmissions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  conversionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00
  },
  // Access control
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Integration settings
  integrations: {
    type: DataTypes.JSON,
    defaultValue: {
      crm: {
        enabled: false,
        provider: null,
        mapping: {}
      },
      email: {
        enabled: false,
        provider: null,
        template: null
      },
      webhook: {
        enabled: false,
        url: null,
        events: []
      }
    }
  }
}, {
  tableName: 'forms',
  timestamps: true,
  underscored: false,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['isPublished']
    },
    {
      fields: ['formType']
    },
    {
      fields: ['accessToken']
    }
  ]
});

module.exports = Form;
