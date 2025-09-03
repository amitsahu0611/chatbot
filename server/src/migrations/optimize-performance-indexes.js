const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const optimizePerformanceIndexes = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    logger.info('🚀 Starting performance optimization - adding composite indexes...');
    
    // Check if tables exist first
    const [faqsExists] = await sequelize.query(
      "SHOW TABLES LIKE 'faqs'",
      { transaction }
    );
    
    const [leadsExists] = await sequelize.query(
      "SHOW TABLES LIKE 'leads'",
      { transaction }
    );
    
    const [usersExists] = await sequelize.query(
      "SHOW TABLES LIKE 'users'",
      { transaction }
    );

    // Optimize FAQ queries (most common: company + active + category filtering)
    if (faqsExists.length > 0) {
      try {
        // Composite index for fast FAQ filtering by company + active status + category
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_faqs_company_active_category ON faqs (company_id, is_active, category)',
          { transaction }
        );
        
        // Composite index for FAQ search with company context
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_faqs_company_search ON faqs (company_id, is_active, views DESC)',
          { transaction }
        );
        
        // Index for ordering FAQs
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_faqs_company_order ON faqs (company_id, `order` ASC, is_active)',
          { transaction }
        );
        
        logger.info('✅ Added FAQ performance indexes');
      } catch (error) {
        logger.warn('FAQ indexes may already exist:', error.message);
      }
    }

    // Optimize Lead queries (most common: company + status + date filtering)
    if (leadsExists.length > 0) {
      try {
        // Composite index for lead listing with filtering
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_leads_company_status_created ON leads (companyId, status, createdAt DESC)',
          { transaction }
        );
        
        // Index for lead search operations
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_leads_company_email_name ON leads (companyId, email, name)',
          { transaction }
        );
        
        // Index for lead assignment queries
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads (assignedTo, status, createdAt DESC)',
          { transaction }
        );
        
        // Index for lead stats queries
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_leads_company_status_priority ON leads (companyId, status, priority)',
          { transaction }
        );
        
        // Index for visitor tracking
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_leads_visitor_company ON leads (visitorId, companyId)',
          { transaction }
        );
        
        logger.info('✅ Added Lead performance indexes');
      } catch (error) {
        logger.warn('Lead indexes may already exist:', error.message);
      }
    }

    // Optimize User queries
    if (usersExists.length > 0) {
      try {
        // Index for company-based user queries
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_users_company_role ON users (companyId, role, isActive)',
          { transaction }
        );
        
        // Index for authentication queries
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_users_email_active ON users (email, isActive)',
          { transaction }
        );
        
        logger.info('✅ Added User performance indexes');
      } catch (error) {
        logger.warn('User indexes may already exist:', error.message);
      }
    }

    // Check for form submissions table
    const [formSubmissionsExists] = await sequelize.query(
      "SHOW TABLES LIKE 'form_submissions'",
      { transaction }
    );

    if (formSubmissionsExists.length > 0) {
      try {
        // Index for form submission queries
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_form_submissions_company_form ON form_submissions (companyId, formId, createdAt DESC)',
          { transaction }
        );
        
        logger.info('✅ Added Form Submission performance indexes');
      } catch (error) {
        logger.warn('Form submission indexes may already exist:', error.message);
      }
    }

    // Check for visitor sessions table
    const [visitorSessionsExists] = await sequelize.query(
      "SHOW TABLES LIKE 'visitor_sessions'",
      { transaction }
    );

    if (visitorSessionsExists.length > 0) {
      try {
        // Index for visitor session queries
        await sequelize.query(
          'CREATE INDEX IF NOT EXISTS idx_visitor_sessions_company_active ON visitor_sessions (companyId, isActive, lastActivity DESC)',
          { transaction }
        );
        
        logger.info('✅ Added Visitor Session performance indexes');
      } catch (error) {
        logger.warn('Visitor session indexes may already exist:', error.message);
      }
    }

    await transaction.commit();
    logger.info('🎉 Performance optimization completed successfully!');
    
  } catch (error) {
    await transaction.rollback();
    logger.error('❌ Error during performance optimization:', error);
    throw error;
  }
};

module.exports = { optimizePerformanceIndexes };
