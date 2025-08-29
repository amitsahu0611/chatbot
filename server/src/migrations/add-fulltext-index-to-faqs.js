const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const addFulltextIndexToFaqs = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if the faqs table exists
    const [results] = await sequelize.query(
      "SHOW TABLES LIKE 'faqs'",
      { transaction }
    );
    
    if (results.length === 0) {
      logger.info('faqs table does not exist, skipping migration');
      await transaction.commit();
      return;
    }
    
    // Check if FULLTEXT index already exists
    const [indexes] = await sequelize.query(
      "SHOW INDEX FROM faqs WHERE Key_name = 'faqs_fulltext_search'",
      { transaction }
    );
    
    if (indexes.length > 0) {
      logger.info('FULLTEXT index already exists on faqs table');
      await transaction.commit();
      return;
    }
    
    // Add FULLTEXT index on question and answer columns (excluding JSON searchKeywords)
    await sequelize.query(
      'ALTER TABLE faqs ADD FULLTEXT INDEX faqs_fulltext_search (question, answer)',
      { transaction }
    );
    
    await transaction.commit();
    logger.info('Successfully added FULLTEXT index to faqs table');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('Error adding FULLTEXT index to faqs table:', error);
    throw error;
  }
};

module.exports = { addFulltextIndexToFaqs };
