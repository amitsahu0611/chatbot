// Load environment variables
require('dotenv').config({ path: './config.env' });

const { sequelize } = require('../src/config/database');

async function createWidgetsTable() {
  try {
    console.log('🔄 Creating widgets table...');
    
    // Create table manually with SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS widgets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL COMMENT 'Company ID for the widget',
        name VARCHAR(255) NOT NULL COMMENT 'Widget name',
        type ENUM('chat', 'form') NOT NULL DEFAULT 'chat' COMMENT 'Widget type (chat or form)',
        status ENUM('active', 'inactive', 'draft') NOT NULL DEFAULT 'active' COMMENT 'Widget status',
        domain VARCHAR(255) COMMENT 'Domain where widget is allowed to run',
        widget_id VARCHAR(255) NOT NULL UNIQUE COMMENT 'Unique widget identifier',
        settings JSON COMMENT 'Widget configuration settings',
        stats JSON COMMENT 'Widget statistics',
        embed_code TEXT NOT NULL COMMENT 'Generated embed code for the widget',
        is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether the widget is active',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_company_id (company_id),
        INDEX idx_widget_id (widget_id),
        INDEX idx_status (status),
        INDEX idx_type (type),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await sequelize.query(createTableSQL);
    console.log('✅ widgets table created successfully!');
    
    console.log('✅ widgets table created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating widgets table:', error);
  } finally {
    await sequelize.close();
    console.log('🔚 Database connection closed');
  }
}

// Run the migration
createWidgetsTable();
