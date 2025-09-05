const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const createSupportSettingsTable = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if the support_settings table already exists
    const [results] = await sequelize.query(
      "SHOW TABLES LIKE 'support_settings'",
      { transaction }
    );
    
    if (results.length > 0) {
      logger.info('support_settings table already exists, skipping creation');
      await transaction.commit();
      return;
    }
    
    // Create the support_settings table
    await sequelize.query(`
      CREATE TABLE support_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        widgetSettings JSON DEFAULT NULL,
        businessHours JSON DEFAULT NULL,
        autoResponse JSON DEFAULT NULL,
        notifications JSON DEFAULT NULL,
        chatSettings JSON DEFAULT NULL,
        integrations JSON DEFAULT NULL,
        customization JSON DEFAULT NULL,
        security JSON DEFAULT NULL,
        analytics JSON DEFAULT NULL,
        advanced JSON DEFAULT NULL,
        createdBy INT NULL,
        updatedBy INT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updatedBy) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_support_settings_company_id (company_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `, { transaction });
    
    await transaction.commit();
    logger.info('Successfully created support_settings table');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error creating support_settings table:', error);
    throw error;
  }
};

module.exports = { createSupportSettingsTable };
