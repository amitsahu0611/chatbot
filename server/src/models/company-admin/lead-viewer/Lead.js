const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const Lead = sequelize.define('Lead', {
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
  // Visitor Information
  visitorId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Location Information
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Device Information
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  browser: {
    type: DataTypes.STRING,
    allowNull: true
  },
  browserVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  os: {
    type: DataTypes.STRING,
    allowNull: true
  },
  osVersion: {
    type: DataTypes.STRING,
    allowNull: true
  },
  device: {
    type: DataTypes.STRING,
    allowNull: true
  },
  screenResolution: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Session Information
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  firstVisit: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastVisit: {
    type: DataTypes.DATE,
    allowNull: true
  },
  visitCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  totalTimeOnSite: {
    type: DataTypes.INTEGER, // in seconds
    defaultValue: 0
  },
  // Page Information
  currentPage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  referrer: {
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
  },
  // Lead Status
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'lost'),
    defaultValue: 'new'
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  // Interaction History
  interactions: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Custom Fields
  customFields: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  // Notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Tags
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Assignment
  assignedTo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  // Timestamps
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Lead Source
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Conversion Information
  convertedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  conversionValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  conversionCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  // Engagement Metrics
  pagesViewed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  formsSubmitted: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  emailsOpened: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  emailsClicked: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Chat Information
  hasChatted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  chatCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastChatAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Social Information
  socialProfiles: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  // Company Information (if B2B)
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  companySize: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Preferences
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      emailOptIn: false,
      smsOptIn: false,
      marketingOptIn: false,
      preferredContactMethod: 'email',
      preferredContactTime: 'business_hours'
    }
  },
  // GDPR Compliance
  gdprConsent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  gdprConsentDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'leads',
  timestamps: true,
  underscored: false, // Keep camelCase field names
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['visitorId']
    },
    {
      fields: ['email']
    },
    {
      fields: ['status']
    },
    {
      fields: ['assignedTo']
    },
    {
      fields: ['lastActivity']
    }
  ]
});

module.exports = Lead;
