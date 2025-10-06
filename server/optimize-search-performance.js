#!/usr/bin/env node

/**
 * Search Performance Optimization Script
 * 
 * This script helps optimize MeiliSearch performance by:
 * 1. Rebuilding the index with optimized settings
 * 2. Clearing old cache entries
 * 3. Running performance tests
 */

const { initializeMeiliSearch, getProductsIndex } = require('./src/config/meilisearch');
const meilisearchService = require('./src/services/meilisearchService');
const logger = require('./src/utils/logger');

async function optimizeSearchPerformance() {
  try {
    console.log('🚀 Starting search performance optimization...');
    
    // 1. Initialize MeiliSearch with optimized settings
    console.log('📝 Reinitializing MeiliSearch with optimized settings...');
    await initializeMeiliSearch();
    
    // 2. Clear cache
    console.log('🧹 Clearing search cache...');
    if (meilisearchService.searchCache) {
      meilisearchService.searchCache.clear();
      console.log('✅ Cache cleared');
    }
    
    // 3. Get index stats
    console.log('📊 Getting index statistics...');
    const productsIndex = getProductsIndex();
    const stats = await productsIndex.getStats();
    console.log('Index stats:', {
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
      fieldDistribution: stats.fieldDistribution
    });
    
    // 4. Run performance test
    console.log('⚡ Running performance test...');
    const testQueries = [
      'jackets for men',
      'shoes',
      'phone',
      'shirt',
      'jeans'
    ];
    
    for (const query of testQueries) {
      const startTime = Date.now();
      const results = await meilisearchService.searchProducts(query, {
        limit: 12,
        offset: 0,
        enableHighlighting: false
      });
      const endTime = Date.now();
      
      console.log(`Query: "${query}" - ${endTime - startTime}ms (${results.hits.length} results)`);
    }
    
    console.log('✅ Performance optimization completed!');
    console.log('\n📈 Performance Tips:');
    console.log('- Use highlighting sparingly (only when needed)');
    console.log('- Cache is enabled for non-highlighting queries');
    console.log('- Index is optimized with reduced ranking rules');
    console.log('- Typo tolerance is tuned for better performance');
    console.log('- Pagination is limited to 1000 max hits');
    
  } catch (error) {
    console.error('❌ Error during optimization:', error);
    process.exit(1);
  }
}

// Run optimization if called directly
if (require.main === module) {
  optimizeSearchPerformance();
}

module.exports = { optimizeSearchPerformance };
