#!/usr/bin/env node

/**
 * Complete Product Setup Script
 * 
 * This script will:
 * 1. Create the products table if it doesn't exist
 * 2. Add sample products to the database
 * 3. Initialize MeiliSearch with optimized settings
 * 4. Sync all products to MeiliSearch
 * 5. Test the search functionality
 */

require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');
const { initializeMeiliSearch } = require('./src/config/meilisearch');
const meilisearchService = require('./src/services/meilisearchService');
const addSampleProducts = require('./add-sample-products');
const logger = require('./src/utils/logger');

async function setupProductsAndSearch() {
  try {
    console.log('🚀 Starting complete product and search setup...\n');
    
    // Step 1: Connect to database
    console.log('📡 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');
    
    // Step 2: Create products table
    console.log('🗄️  Creating products table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        brand VARCHAR(100),
        category VARCHAR(100),
        gender VARCHAR(20),
        stock_quantity INT DEFAULT 0,
        image_url VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Products table ready\n');
    
    // Step 3: Check if products already exist
    console.log('🔍 Checking existing products...');
    const [existingProducts] = await sequelize.query('SELECT COUNT(*) as count FROM products');
    const productCount = existingProducts[0].count;
    
    if (productCount === 0) {
      console.log('📦 No products found, adding sample products...');
      await addSampleProducts();
      console.log('✅ Sample products added successfully\n');
    } else {
      console.log(`✅ Found ${productCount} existing products\n`);
    }
    
    // Step 4: Initialize MeiliSearch
    console.log('🔧 Initializing MeiliSearch...');
    await initializeMeiliSearch();
    console.log('✅ MeiliSearch initialized successfully\n');
    
    // Step 5: Sync products to MeiliSearch
    console.log('🔄 Syncing products to MeiliSearch...');
    const syncResult = await meilisearchService.syncAllProducts();
    console.log(`✅ Successfully synced ${syncResult.count} products to MeiliSearch\n`);
    
    // Step 6: Wait for indexing to complete
    console.log('⏳ Waiting for MeiliSearch indexing to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    // Step 7: Get index stats
    console.log('📊 Getting MeiliSearch index statistics...');
    const stats = await meilisearchService.getIndexStats();
    console.log('Index Stats:', {
      numberOfDocuments: stats.numberOfDocuments,
      isIndexing: stats.isIndexing,
      fieldDistribution: stats.fieldDistribution
    });
    console.log('');
    
    // Step 8: Test search functionality
    console.log('🧪 Testing search functionality...\n');
    
    const testQueries = [
      'clothes for men',
      'men clothing',
      'shirt',
      'jacket',
      'polo',
      'denim',
      'nike',
      'male'
    ];
    
    for (const query of testQueries) {
      try {
        const results = await meilisearchService.searchProducts(query, {
          limit: 5,
          offset: 0,
          enableHighlighting: false
        });
        
        console.log(`🔍 Query: "${query}"`);
        console.log(`   Results: ${results.hits.length} products found`);
        
        if (results.hits.length > 0) {
          results.hits.slice(0, 2).forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.product_name} (${product.gender}, ${product.category})`);
          });
        } else {
          console.log('   ❌ No results found');
        }
        console.log('');
      } catch (error) {
        console.log(`   ❌ Error searching for "${query}": ${error.message}`);
      }
    }
    
    // Step 9: Test specific "clothes for men" query
    console.log('🎯 Testing specific "clothes for men" query...');
    const clothesResults = await meilisearchService.searchProducts('clothes for men', {
      limit: 20,
      offset: 0,
      enableHighlighting: false
    });
    
    console.log(`Found ${clothesResults.hits.length} results for "clothes for men":`);
    clothesResults.hits.forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_name} - ${product.brand} (${product.gender}, ${product.category}) - $${product.price}`);
    });
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 You can now test the API with:');
    console.log('GET /api/super-admin/product-search/search?q=clothes+for+men&limit=20&offset=0');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run setup if called directly
if (require.main === module) {
  setupProductsAndSearch();
}

module.exports = { setupProductsAndSearch };
