require('dotenv').config({ path: './config.env' });
const { connectDB } = require('./src/config/database');
const { fixFaqsTable } = require('./src/migrations/fix-faqs-table');
const { addCompanyIdToSupportSettings } = require('./src/migrations/add-company-id-to-support-settings');
const { addFulltextIndexToFaqs } = require('./src/migrations/add-fulltext-index-to-faqs');
const logger = require('./src/utils/logger');

const runMigration = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Run the migrations
    await fixFaqsTable();
    await addCompanyIdToSupportSettings();
    await addFulltextIndexToFaqs();
    
    logger.info('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
