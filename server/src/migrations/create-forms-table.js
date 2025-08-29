const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('forms', {
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
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      fields: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
      },
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
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
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
      totalSubmissions: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      conversionRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.00
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      accessToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
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
    await queryInterface.addIndex('forms', ['companyId']);
    await queryInterface.addIndex('forms', ['isActive']);
    await queryInterface.addIndex('forms', ['isPublished']);
    await queryInterface.addIndex('forms', ['formType']);
    await queryInterface.addIndex('forms', ['accessToken']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('forms');
  }
};
