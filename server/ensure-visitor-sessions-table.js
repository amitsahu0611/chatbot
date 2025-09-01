// Run this with the existing server process
const VisitorSession = require('./src/models/widget/VisitorSession');

async function ensureVisitorSessionsTable() {
  try {
    console.log('🔄 Ensuring visitor_sessions table exists...');
    
    // Try to sync the table (create if not exists)
    await VisitorSession.sync();
    console.log('✅ VisitorSession table is ready!');
    
    return true;
  } catch (error) {
    console.error('❌ Error ensuring visitor_sessions table:', error.message);
    return false;
  }
}

module.exports = { ensureVisitorSessionsTable };
