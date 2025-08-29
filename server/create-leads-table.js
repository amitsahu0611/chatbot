require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');
const createLeadsTable = require('./src/migrations/create-leads-table');

async function createLeadsTableOnly() {
  try {
    console.log('🔄 Creating leads table...');
    
    // Run leads table migration
    console.log('📋 Creating leads table...');
    await createLeadsTable.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ Leads table created successfully');
    
    console.log('🎉 Leads table migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

createLeadsTableOnly();
