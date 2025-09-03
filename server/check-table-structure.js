// Load environment variables first
require('dotenv').config({ path: './config.env' });

const { sequelize } = require('./src/config/database');

async function checkTableStructure() {
  try {
    console.log('🔄 Checking visitor_sessions table structure...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check table structure
    const [results] = await sequelize.query(`DESCRIBE visitor_sessions`);
    console.log('📋 Current table structure:');
    console.table(results);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

checkTableStructure();
