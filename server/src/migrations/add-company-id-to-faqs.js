const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const addCompanyIdToFaqs = async () => {
  try {
    // Check if companyId column already exists
    const [results] = await sequelize.query(
      "SHOW COLUMNS FROM faqs LIKE 'companyId'"
    );
    
    if (results.length === 0) {
      // Add companyId column
      await sequelize.query(
        "ALTER TABLE faqs ADD COLUMN companyId INT NOT NULL DEFAULT 1"
      );
      
      // Add foreign key constraint
      await sequelize.query(
        "ALTER TABLE faqs ADD CONSTRAINT fk_faqs_company FOREIGN KEY (companyId) REFERENCES companies(id)"
      );
      
      logger.info('Successfully added companyId column to faqs table');
    } else {
      logger.info('companyId column already exists in faqs table');
    }
    
    // Add indexes
    try {
      await sequelize.query(
        "CREATE INDEX faqs_company_id_category ON faqs (companyId, category)"
      );
      logger.info('Successfully created index faqs_company_id_category');
    } catch (indexError) {
      if (indexError.code === 'ER_DUP_KEYNAME') {
        logger.info('Index faqs_company_id_category already exists');
      } else {
        throw indexError;
      }
    }
    
    try {
      await sequelize.query(
        "CREATE INDEX faqs_company_id_active ON faqs (companyId, isActive)"
      );
      logger.info('Successfully created index faqs_company_id_active');
    } catch (indexError) {
      if (indexError.code === 'ER_DUP_KEYNAME') {
        logger.info('Index faqs_company_id_active already exists');
      } else {
        throw indexError;
      }
    }
    
    try {
      await sequelize.query(
        "CREATE INDEX faqs_company_id_order ON faqs (companyId, order)"
      );
      logger.info('Successfully created index faqs_company_id_order');
    } catch (indexError) {
      if (indexError.code === 'ER_DUP_KEYNAME') {
        logger.info('Index faqs_company_id_order already exists');
      } else {
        throw indexError;
      }
    }
    
  } catch (error) {
    logger.error('Error adding companyId to faqs table:', error);
    throw error;
  }
};

module.exports = { addCompanyIdToFaqs };
