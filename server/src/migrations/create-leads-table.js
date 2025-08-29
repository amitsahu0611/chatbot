const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('leads', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      visitorId: {
        type: DataTypes.STRING,
        allowNull: true
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
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
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
        defaultValue: 0
      },
      totalTimeOnSite: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      referrer: {
        type: DataTypes.STRING,
        allowNull: true
      },
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
      interactions: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      customFields: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      tags: {
        type: DataTypes.JSON,
        defaultValue: []
      },
      source: {
        type: DataTypes.STRING,
        allowNull: true
      },
      conversionCurrency: {
        type: DataTypes.STRING,
        defaultValue: 'USD'
      },
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
      socialProfiles: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
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
      gdprConsent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
      },
      assignedTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.addIndex('leads', ['companyId']);
    await queryInterface.addIndex('leads', ['email']);
    await queryInterface.addIndex('leads', ['status']);
    await queryInterface.addIndex('leads', ['source']);
    await queryInterface.addIndex('leads', ['createdAt']);
    await queryInterface.addIndex('leads', ['visitorId']);
    await queryInterface.addIndex('leads', ['assignedTo']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('leads');
  }
};
