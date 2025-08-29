require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');

async function fixLeadsTable() {
  try {
    console.log('🔄 Fixing leads table...');
    
    // Drop the existing leads table
    console.log('🗑️ Dropping existing leads table...');
    await sequelize.query('DROP TABLE IF EXISTS `leads`');
    console.log('✅ Leads table dropped successfully');
    
    // Import and run the migration to recreate the table
    const createLeadsTable = require('./src/migrations/create-leads-table');
    console.log('📋 Creating leads table with correct column names...');
    await createLeadsTable.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ Leads table created successfully with correct column names');
    
    console.log('🎉 Leads table fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to fix leads table:', error);
    process.exit(1);
  }
}

fixLeadsTable();
