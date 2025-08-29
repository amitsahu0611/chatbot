const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FormSubmission = sequelize.define('FormSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  formId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'forms',
      key: 'id'
    }
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  leadId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'leads',
      key: 'id'
    }
  },
  // Submission data
  formData: {
    type: DataTypes.JSON,
    allowNull: false
  },
  // Extracted key fields for easy querying
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Visitor information
  visitorId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Session information
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Submission metadata
  status: {
    type: DataTypes.ENUM('submitted', 'processed', 'failed', 'spam'),
    defaultValue: 'submitted'
  },
  spamScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0.00
  },
  // Processing information
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  leadCreated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  leadCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Integration tracking
  integrations: {
    type: DataTypes.JSON,
    defaultValue: {
      crm: {
        synced: false,
        syncedAt: null,
        externalId: null
      },
      email: {
        sent: false,
        sentAt: null,
        template: null
      },
      webhook: {
        triggered: false,
        triggeredAt: null,
        response: null
      }
    }
  },
  // Error tracking
  errors: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Analytics
  timeToComplete: {
    type: DataTypes.INTEGER, // in seconds
    allowNull: true
  },
  pageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utmSource: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utmMedium: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utmCampaign: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utmTerm: {
    type: DataTypes.STRING,
    allowNull: true
  },
  utmContent: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'form_submissions',
  timestamps: true,
  indexes: [
    {
      fields: ['formId']
    },
    {
      fields: ['companyId']
    },
    {
      fields: ['leadId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['visitorId']
    }
  ]
});

module.exports = FormSubmission;
