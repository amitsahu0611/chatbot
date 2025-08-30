const { sequelize } = require('../config/database');

const createActivityLogsTable = async () => {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type ENUM(
        'company_registered',
        'user_created',
        'user_updated',
        'user_deleted',
        'subscription_upgraded',
        'subscription_downgraded',
        'lead_created',
        'lead_updated',
        'form_submitted',
        'faq_created',
        'widget_created',
        'login',
        'logout',
        'system_action'
      ) NOT NULL,
      entityType ENUM('user', 'company', 'lead', 'form', 'faq', 'widget', 'system') NOT NULL,
      entityId INT NULL,
      userId INT NULL,
      companyId INT NULL,
      description TEXT NOT NULL,
      metadata JSON DEFAULT (JSON_OBJECT()),
      ipAddress VARCHAR(45) NULL,
      userAgent TEXT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_activity_logs_type (type),
      INDEX idx_activity_logs_entity_type (entityType),
      INDEX idx_activity_logs_user_id (userId),
      INDEX idx_activity_logs_company_id (companyId),
      INDEX idx_activity_logs_created_at (createdAt),
      
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE SET NULL
    )
  `);
  
  console.log('Activity logs table created successfully');
};

module.exports = createActivityLogsTable;
