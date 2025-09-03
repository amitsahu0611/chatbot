// Load environment variables first
require('dotenv').config({ path: './config.env' });

const { sequelize } = require('./src/config/database');

async function createIndexes() {
  try {
    console.log('🔄 Creating indexes for visitor_sessions table...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Add indexes with correct column names (snake_case)
    try {
      await sequelize.query(`CREATE INDEX idx_visitor_sessions_ip_company ON visitor_sessions (ip_address, company_id)`);
      console.log('✅ Added index for ip_address and company_id');
    } catch (e) {
      if (e.original.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_visitor_sessions_ip_company already exists');
      } else {
        throw e;
      }
    }
    
    try {
      await sequelize.query(`CREATE INDEX idx_visitor_sessions_expires_at ON visitor_sessions (expires_at)`);
      console.log('✅ Added index for expires_at');
    } catch (e) {
      if (e.original.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_visitor_sessions_expires_at already exists');
      } else {
        throw e;
      }
    }
    
    try {
      await sequelize.query(`CREATE INDEX idx_visitor_sessions_is_active ON visitor_sessions (is_active)`);
      console.log('✅ Added index for is_active');
    } catch (e) {
      if (e.original.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️ Index idx_visitor_sessions_is_active already exists');
      } else {
        throw e;
      }
    }
    
    console.log('🎉 Indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Index creation failed:', error);
    process.exit(1);
  }
}

createIndexes();
