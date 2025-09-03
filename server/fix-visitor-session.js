// Load environment variables first
require('dotenv').config({ path: './config.env' });

const { sequelize } = require('./src/config/database');
const VisitorSession = require('./src/models/widget/VisitorSession');

async function fixVisitorSessionTable() {
  try {
    console.log('🔄 Starting VisitorSession table fix...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Drop existing table to recreate with correct schema
    await sequelize.query('DROP TABLE IF EXISTS visitor_sessions');
    console.log('🗑️ Dropped existing visitor_sessions table');
    
    // Sync the model to create table with correct schema
    await VisitorSession.sync({ force: true });
    console.log('✅ Created visitor_sessions table with correct schema');
    
    // Add indexes manually if needed
    await sequelize.query(`
      CREATE INDEX idx_visitor_sessions_ip_company ON visitor_sessions (ipAddress, companyId);
    `);
    console.log('✅ Added index for ipAddress and companyId');
    
    await sequelize.query(`
      CREATE INDEX idx_visitor_sessions_expires_at ON visitor_sessions (expiresAt);
    `);
    console.log('✅ Added index for expiresAt');
    
    await sequelize.query(`
      CREATE INDEX idx_visitor_sessions_is_active ON visitor_sessions (isActive);
    `);
    console.log('✅ Added index for isActive');
    
    await sequelize.query(`
      CREATE INDEX idx_visitor_sessions_session_token ON visitor_sessions (sessionToken);
    `);
    console.log('✅ Added index for sessionToken');
    
    console.log('🎉 VisitorSession table fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

fixVisitorSessionTable();
