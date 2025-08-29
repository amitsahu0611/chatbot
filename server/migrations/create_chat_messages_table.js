// Load environment variables
require('dotenv').config({ path: './config.env' });

const { sequelize } = require('../src/config/database');

async function createChatMessagesTable() {
  try {
    console.log('🔄 Creating chat_messages table...');
    
    // Create table manually with SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ipAddress VARCHAR(45) NOT NULL COMMENT 'IP address of the user',
        companyId INT NOT NULL COMMENT 'Company ID for the chat session',
        sessionId VARCHAR(255) NOT NULL COMMENT 'Unique session identifier',
        messageType ENUM('user', 'bot') NOT NULL COMMENT 'Type of message (user or bot)',
        content TEXT NOT NULL COMMENT 'Message content',
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Message timestamp',
        metadata JSON COMMENT 'Additional message metadata (user agent, etc.)',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_ip_company (ipAddress, companyId),
        INDEX idx_session (sessionId),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await sequelize.query(createTableSQL);
    console.log('✅ chat_messages table created successfully!');
    
    // Test the table by inserting a sample record
    const testMessageSQL = `
      INSERT INTO chat_messages (ipAddress, companyId, sessionId, messageType, content, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const testMetadata = JSON.stringify({
      userAgent: 'Test Agent',
      timestamp: new Date().toISOString()
    });
    
    const [result] = await sequelize.query(testMessageSQL, {
      replacements: ['127.0.0.1', 6, 'test_session_123', 'user', 'Test message', testMetadata]
    });
    
    console.log('✅ Test message inserted successfully:', result.insertId);
    
    // Clean up test message
    await sequelize.query('DELETE FROM chat_messages WHERE id = ?', {
      replacements: [result.insertId]
    });
    console.log('✅ Test message cleaned up');
    
  } catch (error) {
    console.error('❌ Error creating chat_messages table:', error);
  } finally {
    await sequelize.close();
    console.log('🔚 Database connection closed');
  }
}

// Run the migration
createChatMessagesTable();
