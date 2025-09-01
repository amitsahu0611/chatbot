const { sequelize } = require('../config/database');

async function createVisitorSessionsTable() {
  try {
    await sequelize.getQueryInterface().createTable('visitor_sessions', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ipAddress: {
        type: sequelize.Sequelize.STRING(45),
        allowNull: false
      },
      companyId: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false
      },
      sessionToken: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      visitorName: {
        type: sequelize.Sequelize.STRING(100),
        allowNull: true
      },
      visitorEmail: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true
      },
      visitorPhone: {
        type: sequelize.Sequelize.STRING(20),
        allowNull: true
      },
      topic: {
        type: sequelize.Sequelize.STRING(255),
        allowNull: true
      },
      userAgent: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      },
      country: {
        type: sequelize.Sequelize.STRING(100),
        allowNull: true
      },
      city: {
        type: sequelize.Sequelize.STRING(100),
        allowNull: true
      },
      firstVisit: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      },
      lastActivity: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      },
      expiresAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false
      },
      isActive: {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      messageCount: {
        type: sequelize.Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      leadCreated: {
        type: sequelize.Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      metadata: {
        type: sequelize.Sequelize.JSON,
        allowNull: true,
        defaultValue: '{}'
      },
      createdAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      },
      updatedAt: {
        type: sequelize.Sequelize.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.NOW
      }
    });

    // Add indexes
    await sequelize.getQueryInterface().addIndex('visitor_sessions', ['ipAddress']);
    await sequelize.getQueryInterface().addIndex('visitor_sessions', ['companyId']);
    await sequelize.getQueryInterface().addIndex('visitor_sessions', ['expiresAt']);
    await sequelize.getQueryInterface().addIndex('visitor_sessions', ['isActive']);
    await sequelize.getQueryInterface().addIndex('visitor_sessions', ['ipAddress', 'companyId']);

    console.log('✅ visitor_sessions table created successfully');
  } catch (error) {
    console.error('❌ Error creating visitor_sessions table:', error);
    throw error;
  }
}

module.exports = createVisitorSessionsTable;

// Run migration if called directly
if (require.main === module) {
  createVisitorSessionsTable()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
