const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const VisitorSession = sequelize.define('VisitorSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ipAddress: {
    type: DataTypes.STRING(45), // Supports both IPv4 and IPv6
    allowNull: false,
    index: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    index: true
  },
  sessionToken: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  visitorName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  visitorEmail: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  visitorPhone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  topic: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  firstVisit: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  messageCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  leadCreated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // leadId: {
  //   type: DataTypes.INTEGER,
  //   allowNull: true,
  //   references: {
  //     model: 'leads',
  //     key: 'id'
  //   }
  // },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  }
}, {
  tableName: 'visitor_sessions',
  timestamps: true
});

// Static methods
VisitorSession.findActiveSession = async function(ipAddress, companyId) {
  const session = await this.findOne({
    where: {
      ipAddress,
      companyId,
      isActive: true,
      expiresAt: {
        [sequelize.Sequelize.Op.gt]: new Date()
      }
    },
    order: [['lastActivity', 'DESC']]
  });
  
  return session;
};

VisitorSession.createSession = async function(ipAddress, companyId, sessionDurationMinutes = 120) {
  const crypto = require('crypto');
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + (sessionDurationMinutes * 60 * 1000));
  
  const session = await this.create({
    ipAddress,
    companyId,
    sessionToken,
    expiresAt,
    firstVisit: new Date(),
    lastActivity: new Date()
  });
  
  return session;
};

VisitorSession.updateActivity = async function(sessionToken) {
  const session = await this.findOne({
    where: { sessionToken, isActive: true }
  });
  
  if (session) {
    session.lastActivity = new Date();
    await session.save();
    return session;
  }
  
  return null;
};

VisitorSession.cleanupExpiredSessions = async function() {
  const expired = await this.update(
    { isActive: false },
    {
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        },
        isActive: true
      }
    }
  );
  
  return expired;
};

module.exports = VisitorSession;
