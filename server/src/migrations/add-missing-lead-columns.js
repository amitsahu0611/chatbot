const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to leads table
    const columns = [
      // Location Information
      {
        name: 'country',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'city',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'region',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'timezone',
        type: DataTypes.STRING,
        allowNull: true
      },
      // Device Information
      {
        name: 'browser',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'browserVersion',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'os',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'osVersion',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'device',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'screenResolution',
        type: DataTypes.STRING,
        allowNull: true
      },
      // Session Information
      {
        name: 'sessionId',
        type: DataTypes.STRING,
        allowNull: true
      },
      // Page Information
      {
        name: 'currentPage',
        type: DataTypes.STRING,
        allowNull: true
      },
      // UTM Parameters
      {
        name: 'utmSource',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'utmMedium',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'utmCampaign',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'utmTerm',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'utmContent',
        type: DataTypes.STRING,
        allowNull: true
      },
      // Timestamps
      {
        name: 'lastActivity',
        type: DataTypes.DATE,
        allowNull: true
      },
      // Conversion Information
      {
        name: 'convertedAt',
        type: DataTypes.DATE,
        allowNull: true
      },
      {
        name: 'conversionValue',
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      // Company Information (B2B)
      {
        name: 'company',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'jobTitle',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'industry',
        type: DataTypes.STRING,
        allowNull: true
      },
      {
        name: 'companySize',
        type: DataTypes.STRING,
        allowNull: true
      },
      // GDPR Compliance
      {
        name: 'gdprConsentDate',
        type: DataTypes.DATE,
        allowNull: true
      }
    ];

    // Add each column
    for (const column of columns) {
      try {
        await queryInterface.addColumn('leads', column.name, {
          type: column.type,
          allowNull: column.allowNull
        });
        console.log(`Added column: ${column.name}`);
      } catch (error) {
        // If column already exists, skip it
        if (error.message.includes('Duplicate column name')) {
          console.log(`Column ${column.name} already exists, skipping...`);
        } else {
          console.error(`Error adding column ${column.name}:`, error.message);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns in reverse order
    const columns = [
      'gdprConsentDate',
      'companySize',
      'industry',
      'jobTitle',
      'company',
      'conversionValue',
      'convertedAt',
      'lastActivity',
      'utmContent',
      'utmTerm',
      'utmCampaign',
      'utmMedium',
      'utmSource',
      'currentPage',
      'sessionId',
      'screenResolution',
      'device',
      'osVersion',
      'os',
      'browserVersion',
      'browser',
      'timezone',
      'region',
      'city',
      'country'
    ];

    for (const columnName of columns) {
      try {
        await queryInterface.removeColumn('leads', columnName);
        console.log(`Removed column: ${columnName}`);
      } catch (error) {
        console.error(`Error removing column ${columnName}:`, error.message);
      }
    }
  }
};
