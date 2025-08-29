const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('form_submissions', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      leadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'leads',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      formData: {
        type: DataTypes.JSON,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
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
      sessionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('submitted', 'processed', 'failed', 'spam'),
        defaultValue: 'submitted'
      },
      spamScore: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.00
      },
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
      errors: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      timeToComplete: {
        type: DataTypes.INTEGER,
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
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('form_submissions', ['formId']);
    await queryInterface.addIndex('form_submissions', ['companyId']);
    await queryInterface.addIndex('form_submissions', ['leadId']);
    await queryInterface.addIndex('form_submissions', ['email']);
    await queryInterface.addIndex('form_submissions', ['status']);
    await queryInterface.addIndex('form_submissions', ['createdAt']);
    await queryInterface.addIndex('form_submissions', ['visitorId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('form_submissions');
  }
};
