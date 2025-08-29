const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const UnansweredQuery = sequelize.define('UnansweredQuery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
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
  query: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'The user question that could not be answered'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent'
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'session_id'
  },
  frequency: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
    comment: 'How many times this question has been asked'
  },
  status: {
    type: DataTypes.ENUM('pending', 'answered', 'ignored'),
    defaultValue: 'pending',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
    allowNull: false
  },
  lastAsked: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'last_asked',
    defaultValue: DataTypes.NOW
  },
  relatedFaqId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'related_faq_id',
    references: {
      model: 'faqs',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'unanswered_queries',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['frequency']
    },
    {
      fields: ['lastAsked']
    }
  ]
});

// Define associations
UnansweredQuery.associate = (models) => {
  // Belongs to Company
  UnansweredQuery.belongsTo(models.Company, {
    foreignKey: 'companyId',
    as: 'company'
  });

  // Belongs to FAQ (optional - when answered)
  UnansweredQuery.belongsTo(models.FAQ, {
    foreignKey: 'relatedFaqId',
    as: 'relatedFaq',
    constraints: false
  });
};

// Instance methods
UnansweredQuery.prototype.incrementFrequency = function() {
  return this.increment('frequency');
};

UnansweredQuery.prototype.markAsAnswered = function(faqId) {
  return this.update({
    status: 'answered',
    relatedFaqId: faqId
  });
};

UnansweredQuery.prototype.updatePriority = function() {
  let priority = 'low';
  
  if (this.frequency >= 10) {
    priority = 'high';
  } else if (this.frequency >= 5) {
    priority = 'medium';
  }
  
  return this.update({ priority });
};

// Static methods
UnansweredQuery.findOrCreateQuery = async function(queryData) {
  const { companyId, query, ipAddress, userAgent, sessionId } = queryData;
  
  // Normalize query for matching (remove extra spaces, lowercase for comparison)
  const normalizedQuery = query.trim().toLowerCase();
  
  // Try to find existing similar query
  const existingQuery = await this.findOne({
    where: {
      companyId: companyId,
      status: 'pending'
    },
    order: [['frequency', 'DESC'], ['lastAsked', 'DESC']]
  });

  if (existingQuery) {
    // Check if queries are similar (simple similarity check)
    const existingNormalized = existingQuery.query.toLowerCase();
    if (existingNormalized.includes(normalizedQuery) || normalizedQuery.includes(existingNormalized)) {
      // Update existing query
      await existingQuery.update({
        lastAsked: new Date(),
        ipAddress: ipAddress,
        userAgent: userAgent,
        sessionId: sessionId
      });
      await existingQuery.incrementFrequency();
      await existingQuery.updatePriority();
      return existingQuery;
    }
  }
  
  // Create new query record
  const newQuery = await this.create({
    companyId,
    query: query.trim(),
    ipAddress,
    userAgent,
    sessionId,
    frequency: 1,
    status: 'pending',
    priority: 'low',
    lastAsked: new Date()
  });
  
  return newQuery;
};

UnansweredQuery.getTopUnansweredForCompany = async function(companyId, limit = 20) {
  return this.findAll({
    where: {
      companyId: companyId,
      status: 'pending'
    },
    order: [
      ['frequency', 'DESC'],
      ['lastAsked', 'DESC']
    ],
    limit: limit
  });
};

module.exports = UnansweredQuery;
