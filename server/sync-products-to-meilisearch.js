require('dotenv').config({ path: './config.env' });
const { initializeMeiliSearch } = require('./src/config/meilisearch');
const meilisearchService = require('./src/services/meilisearchService');
const logger = require('./src/utils/logger');

async function syncProductsToMeiliSearch() {
  try {
    console.log('🚀 Starting MeiliSearch setup and product sync...');
    
    // Initialize MeiliSearch
    console.log('📡 Initializing MeiliSearch...');
    await initializeMeiliSearch();
    console.log('✅ MeiliSearch initialized successfully');
    
    // Sync all products
    console.log('🔄 Syncing products to MeiliSearch...');
    const result = await meilisearchService.syncAllProducts();
    
    if (result.success) {
      console.log(`✅ Successfully synced ${result.count} products to MeiliSearch`);
      console.log(`📊 Task UID: ${result.taskUid}`);
    } else {
      console.log('❌ Failed to sync products');
    }
    
    // Get index stats
    console.log('📈 Getting index statistics...');
    const stats = await meilisearchService.getIndexStats();
    console.log('📊 Index Stats:', {
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
      fieldDistribution: stats.fieldDistribution
    });
    
    console.log('🎉 MeiliSearch setup and sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during MeiliSearch setup:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  syncProductsToMeiliSearch()
    .then(() => {
      console.log('✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = syncProductsToMeiliSearch;
