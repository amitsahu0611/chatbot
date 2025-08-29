const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const addCompanyIdToSupportSettings = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if the support_settings table exists
    const [results] = await sequelize.query(
      "SHOW TABLES LIKE 'support_settings'",
      { transaction }
    );
    
    if (results.length === 0) {
      logger.info('support_settings table does not exist, skipping migration');
      await transaction.commit();
      return;
    }
    
    // Check if companyId column already exists
    const [columns] = await sequelize.query(
      "SHOW COLUMNS FROM support_settings LIKE 'companyId'",
      { transaction }
    );
    
    if (columns.length > 0) {
      logger.info('companyId column already exists in support_settings table');
      await transaction.commit();
      return;
    }
    
    // Add companyId column
    await sequelize.query(
      `ALTER TABLE support_settings 
       ADD COLUMN companyId INT NOT NULL,
       ADD CONSTRAINT fk_support_settings_company 
       FOREIGN KEY (companyId) REFERENCES companies(id)`,
      { transaction }
    );
    
    // Add index on companyId
    await sequelize.query(
      'CREATE INDEX support_settings_company_id ON support_settings (companyId)',
      { transaction }
    );
    
    await transaction.commit();
    logger.info('Successfully added companyId column to support_settings table');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error adding companyId to support_settings table:', error);
    throw error;
  }
};

module.exports = { addCompanyIdToSupportSettings };
