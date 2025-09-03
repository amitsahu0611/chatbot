// Load environment variables first
require('dotenv').config({ path: './config.env' });

const { sequelize } = require('./src/config/database');
const migration = require('./src/migrations/fix-visitor-session-table');

async function runMigration() {
  try {
    console.log('🔄 Starting VisitorSession table migration...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run the migration
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
