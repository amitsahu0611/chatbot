const { sequelize } = require('./src/config/database');
const VisitorSession = require('./src/models/widget/VisitorSession');

async function syncVisitorSessions() {
  try {
    console.log('🔄 Starting VisitorSession table sync...');
    
    // First check if table exists
    const tableExists = await sequelize.getQueryInterface().showAllTables()
      .then(tables => tables.includes('visitor_sessions'));
    
    if (tableExists) {
      console.log('📋 Table visitor_sessions already exists, dropping it...');
      await sequelize.getQueryInterface().dropTable('visitor_sessions');
    }
    
    // Create the table fresh
    console.log('🔧 Creating visitor_sessions table...');
    await VisitorSession.sync({ force: true });
    
    console.log('✅ VisitorSession table created successfully!');
    
    // Test that we can create a session
    console.log('🧪 Testing session creation...');
    const testSession = await VisitorSession.createSession('127.0.0.1', 13, 120);
    console.log('✅ Test session created:', testSession.sessionToken);
    
    // Clean up test session
    await testSession.destroy();
    console.log('🧹 Test session cleaned up');
    
    console.log('🎉 VisitorSession setup complete!');
  } catch (error) {
    console.error('❌ Error syncing VisitorSession table:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

syncVisitorSessions();

