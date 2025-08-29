require('dotenv').config({ path: './config.env' });
const { connectDB } = require('./src/config/database');
const { sequelize } = require('./src/config/database');
const logger = require('./src/utils/logger');

const runLeadMigration = async () => {
  try {
    // Connect to database
    await connectDB();
    
    logger.info('Starting lead columns migration...');
    
    // Add missing columns to leads table
    const columns = [
      // Location Information
      { name: 'country', type: 'VARCHAR(255)', allowNull: true },
      { name: 'city', type: 'VARCHAR(255)', allowNull: true },
      { name: 'region', type: 'VARCHAR(255)', allowNull: true },
      { name: 'timezone', type: 'VARCHAR(255)', allowNull: true },
      // Device Information
      { name: 'browser', type: 'VARCHAR(255)', allowNull: true },
      { name: 'browserVersion', type: 'VARCHAR(255)', allowNull: true },
      { name: 'os', type: 'VARCHAR(255)', allowNull: true },
      { name: 'osVersion', type: 'VARCHAR(255)', allowNull: true },
      { name: 'device', type: 'VARCHAR(255)', allowNull: true },
      { name: 'screenResolution', type: 'VARCHAR(255)', allowNull: true },
      // Session Information
      { name: 'sessionId', type: 'VARCHAR(255)', allowNull: true },
      // Page Information
      { name: 'currentPage', type: 'VARCHAR(255)', allowNull: true },
      // UTM Parameters
      { name: 'utmSource', type: 'VARCHAR(255)', allowNull: true },
      { name: 'utmMedium', type: 'VARCHAR(255)', allowNull: true },
      { name: 'utmCampaign', type: 'VARCHAR(255)', allowNull: true },
      { name: 'utmTerm', type: 'VARCHAR(255)', allowNull: true },
      { name: 'utmContent', type: 'VARCHAR(255)', allowNull: true },
      // Timestamps
      { name: 'lastActivity', type: 'DATETIME', allowNull: true },
      // Conversion Information
      { name: 'convertedAt', type: 'DATETIME', allowNull: true },
      { name: 'conversionValue', type: 'DECIMAL(10,2)', allowNull: true },
      // Company Information (B2B)
      { name: 'company', type: 'VARCHAR(255)', allowNull: true },
      { name: 'jobTitle', type: 'VARCHAR(255)', allowNull: true },
      { name: 'industry', type: 'VARCHAR(255)', allowNull: true },
      { name: 'companySize', type: 'VARCHAR(255)', allowNull: true },
      // GDPR Compliance
      { name: 'gdprConsentDate', type: 'DATETIME', allowNull: true }
    ];

    // Add each column
    for (const column of columns) {
      try {
        await sequelize.query(`ALTER TABLE leads ADD COLUMN ${column.name} ${column.type} ${column.allowNull ? 'NULL' : 'NOT NULL'}`);
        logger.info(`Added column: ${column.name}`);
      } catch (error) {
        // If column already exists, skip it
        if (error.message.includes('Duplicate column name') || error.message.includes('already exists')) {
          logger.info(`Column ${column.name} already exists, skipping...`);
        } else {
          logger.error(`Error adding column ${column.name}:`, error.message);
        }
      }
    }
    
    logger.info('Lead columns migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

runLeadMigration();
