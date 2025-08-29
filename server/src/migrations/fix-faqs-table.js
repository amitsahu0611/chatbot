const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const fixFaqsTable = async () => {
  try {
    // First, let's see what columns currently exist
    const [columns] = await sequelize.query("SHOW COLUMNS FROM faqs");
    const existingColumns = columns.map(col => col.Field);
    logger.info('Existing columns in faqs table:', existingColumns);
    
    // Define all required columns and their properties
    const requiredColumns = [
      {
        name: 'companyId',
        definition: 'INT NOT NULL DEFAULT 1',
        constraint: 'ALTER TABLE faqs ADD CONSTRAINT fk_faqs_company FOREIGN KEY (companyId) REFERENCES companies(id)'
      },
      {
        name: 'isActive',
        definition: 'BOOLEAN DEFAULT TRUE'
      },
      {
        name: 'views',
        definition: 'INT DEFAULT 0'
      },
      {
        name: 'helpfulCount',
        definition: 'INT DEFAULT 0'
      },
      {
        name: 'notHelpfulCount',
        definition: 'INT DEFAULT 0'
      },
      {
        name: 'order',
        definition: 'INT DEFAULT 0'
      },
      {
        name: 'tags',
        definition: 'JSON'
      },
      {
        name: 'searchKeywords',
        definition: 'JSON'
      },
      {
        name: 'createdBy',
        definition: 'INT',
        constraint: 'ALTER TABLE faqs ADD CONSTRAINT fk_faqs_created_by FOREIGN KEY (createdBy) REFERENCES users(id)'
      },
      {
        name: 'updatedBy',
        definition: 'INT',
        constraint: 'ALTER TABLE faqs ADD CONSTRAINT fk_faqs_updated_by FOREIGN KEY (updatedBy) REFERENCES users(id)'
      }
    ];
    
    // Add missing columns
    for (const column of requiredColumns) {
      if (!existingColumns.includes(column.name)) {
        try {
          await sequelize.query(`ALTER TABLE faqs ADD COLUMN ${column.name} ${column.definition}`);
          logger.info(`Successfully added column: ${column.name}`);
          
          // Add foreign key constraint if specified
          if (column.constraint) {
            try {
              await sequelize.query(column.constraint);
              logger.info(`Successfully added foreign key constraint for: ${column.name}`);
            } catch (constraintError) {
              if (constraintError.code === 'ER_DUP_KEYNAME') {
                logger.info(`Foreign key constraint for ${column.name} already exists`);
              } else {
                logger.warn(`Could not add foreign key constraint for ${column.name}:`, constraintError.message);
              }
            }
          }
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            logger.info(`Column ${column.name} already exists`);
          } else {
            throw error;
          }
        }
      } else {
        logger.info(`Column ${column.name} already exists`);
      }
    }
    
    // Add indexes
    const indexes = [
      { name: 'faqs_company_id_category', fields: ['companyId', 'category'] },
      { name: 'faqs_company_id_active', fields: ['companyId', 'isActive'] },
      { name: 'faqs_company_id_order', fields: ['companyId', 'order'] }
    ];
    
    for (const index of indexes) {
      try {
        const fields = index.fields.join(', ');
        await sequelize.query(`CREATE INDEX ${index.name} ON faqs (${fields})`);
        logger.info(`Successfully created index: ${index.name}`);
      } catch (indexError) {
        if (indexError.code === 'ER_DUP_KEYNAME') {
          logger.info(`Index ${index.name} already exists`);
        } else {
          logger.warn(`Could not create index ${index.name}:`, indexError.message);
        }
      }
    }
    
    logger.info('Faqs table structure fixed successfully');
    
  } catch (error) {
    logger.error('Error fixing faqs table:', error);
    throw error;
  }
};

module.exports = { fixFaqsTable };
