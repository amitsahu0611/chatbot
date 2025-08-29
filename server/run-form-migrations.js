require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');
const createFormsTable = require('./src/migrations/create-forms-table');
const createFormSubmissionsTable = require('./src/migrations/create-form-submissions-table');
const createLeadsTable = require('./src/migrations/create-leads-table');

async function runMigrations() {
  try {
    console.log('🔄 Running form migrations...');
    
    // Run forms table migration
    console.log('📋 Creating forms table...');
    await createFormsTable.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    console.log('✅ Forms table created successfully');
    
         // Run form submissions table migration
     console.log('📋 Creating form_submissions table...');
     await createFormSubmissionsTable.up(sequelize.getQueryInterface(), sequelize.Sequelize);
     console.log('✅ Form submissions table created successfully');
     
     // Run leads table migration
     console.log('📋 Creating leads table...');
     await createLeadsTable.up(sequelize.getQueryInterface(), sequelize.Sequelize);
     console.log('✅ Leads table created successfully');
     
     console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
