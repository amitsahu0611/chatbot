#!/usr/bin/env node

/**
 * Dynamic Product Data Test Script
 * 
 * This script demonstrates how to fetch product data dynamically from the database
 * instead of using static hardcoded data.
 */

require('dotenv').config({ path: './config.env' });
const { Product } = require('./src/models');
const { Op } = require('sequelize');
const { sequelize } = require('./src/config/database');

async function testDynamicProductFetching() {
  try {
    console.log('🔍 Testing Dynamic Product Data Fetching\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Test 1: Get all products with pagination
    console.log('📄 Test 1: Get all products (first 20)');
    const allProducts = await Product.findAndCountAll({
      limit: 20,
      offset: 0,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'product_name', 'brand', 'category', 'gender', 'price', 'stock_quantity']
    });
    
    console.log(`Found ${allProducts.count} total products, showing first ${allProducts.rows.length}:`);
    allProducts.rows.slice(0, 5).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.product_name} - ${product.brand} (${product.category}) - $${product.price}`);
    });
    console.log('');
    
    // Test 2: Search for men's clothing dynamically
    console.log('👔 Test 2: Search for men\'s clothing');
    const menClothing = await Product.findAndCountAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { gender: 'Male' },
              { gender: 'Men' }
            ]
          },
          {
            [Op.or]: [
              { category: { [Op.like]: '%Clothing%' } },
              { product_name: { [Op.like]: '%shirt%' } },
              { product_name: { [Op.like]: '%jacket%' } },
              { product_name: { [Op.like]: '%pants%' } },
              { product_name: { [Op.like]: '%jeans%' } }
            ]
          }
        ]
      },
      limit: 10,
      attributes: ['id', 'product_name', 'brand', 'category', 'gender', 'price']
    });
    
    console.log(`Found ${menClothing.count} men's clothing items:`);
    menClothing.rows.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.product_name} - ${product.brand} (${product.gender}) - $${product.price}`);
    });
    console.log('');
    
    // Test 3: Get dynamic statistics
    console.log('📊 Test 3: Dynamic Product Statistics');
    
    // Category distribution
    const categoryStats = await Product.findAll({
      attributes: [
        'category',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });
    
    console.log('Categories:');
    categoryStats.forEach(stat => {
      console.log(`  ${stat.category}: ${stat.count} products`);
    });
    console.log('');
    
    // Brand distribution (top 5)
    const brandStats = await Product.findAll({
      attributes: [
        'brand',
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'count']
      ],
      group: ['brand'],
      order: [[Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });
    
    console.log('Top 5 Brands:');
    brandStats.forEach(stat => {
      console.log(`  ${stat.brand}: ${stat.count} products`);
    });
    console.log('');
    
    // Test 4: Dynamic filtering options
    console.log('🔧 Test 4: Dynamic Filter Options');
    
    const uniqueCategories = await Product.findAll({
      attributes: ['category'],
      group: ['category'],
      where: { category: { [Op.ne]: null } },
      raw: true
    });
    
    const uniqueBrands = await Product.findAll({
      attributes: ['brand'],
      group: ['brand'],
      where: { brand: { [Op.ne]: null } },
      order: [['brand', 'ASC']],
      raw: true
    });
    
    console.log('Available Categories:', uniqueCategories.map(c => c.category).join(', '));
    console.log('Available Brands:', uniqueBrands.map(b => b.brand).slice(0, 10).join(', '));
    console.log('');
    
    // Test 5: Price range analysis
    console.log('💰 Test 5: Price Range Analysis');
    
    const priceStats = await Product.findAll({
      attributes: [
        [Product.sequelize.fn('MIN', Product.sequelize.col('price')), 'minPrice'],
        [Product.sequelize.fn('MAX', Product.sequelize.col('price')), 'maxPrice'],
        [Product.sequelize.fn('AVG', Product.sequelize.col('price')), 'avgPrice'],
        [Product.sequelize.fn('COUNT', Product.sequelize.col('id')), 'totalProducts']
      ],
      raw: true
    });
    
    const stats = priceStats[0];
    console.log(`Price Range: $${parseFloat(stats.minPrice).toFixed(2)} - $${parseFloat(stats.maxPrice).toFixed(2)}`);
    console.log(`Average Price: $${parseFloat(stats.avgPrice).toFixed(2)}`);
    console.log(`Total Products: ${stats.totalProducts}`);
    console.log('');
    
    // Test 6: Search with multiple filters
    console.log('🔍 Test 6: Advanced Search with Filters');
    
    const advancedSearch = await Product.findAndCountAll({
      where: {
        [Op.and]: [
          { category: 'Clothing' },
          { price: { [Op.between]: [20, 100] } },
          {
            [Op.or]: [
              { product_name: { [Op.like]: '%shirt%' } },
              { product_name: { [Op.like]: '%jacket%' } }
            ]
          }
        ]
      },
      limit: 5,
      attributes: ['product_name', 'brand', 'price', 'gender']
    });
    
    console.log(`Advanced search results (${advancedSearch.count} found):`);
    advancedSearch.rows.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.product_name} - ${product.brand} (${product.gender}) - $${product.price}`);
    });
    
    console.log('\n🎉 Dynamic product data fetching test completed!');
    console.log('\n📋 Available API Endpoints:');
    console.log('GET /api/super-admin/products - Get all products with dynamic filtering');
    console.log('GET /api/super-admin/products/stats - Get dynamic product statistics');
    console.log('GET /api/super-admin/products/filters - Get dynamic filter options');
    console.log('GET /api/super-admin/product-search/search - MeiliSearch with dynamic data');
    
  } catch (error) {
    console.error('❌ Error testing dynamic product fetching:', error);
  } finally {
    await sequelize.close();
  }
}

// Example API usage
function showAPIExamples() {
  console.log('\n📖 API Usage Examples:\n');
  
  const baseUrl = 'http://localhost:30006/api/super-admin';
  
  console.log('1. Get all products with pagination:');
  console.log(`   GET ${baseUrl}/products?page=1&limit=20&sortBy=product_name&sortOrder=ASC\n`);
  
  console.log('2. Search products by category:');
  console.log(`   GET ${baseUrl}/products?category=Clothing&page=1&limit=20\n`);
  
  console.log('3. Search products by gender:');
  console.log(`   GET ${baseUrl}/products?gender=Male&page=1&limit=20\n`);
  
  console.log('4. Search with multiple filters:');
  console.log(`   GET ${baseUrl}/products?search=shirt&brand=Nike&gender=Male&page=1&limit=20\n`);
  
  console.log('5. Get product statistics:');
  console.log(`   GET ${baseUrl}/products/stats\n`);
  
  console.log('6. Get filter options:');
  console.log(`   GET ${baseUrl}/products/filters\n`);
  
  console.log('7. MeiliSearch with dynamic data:');
  console.log(`   GET ${baseUrl}/product-search/search?q=clothes+for+men&limit=20&offset=0\n`);
}

// Run the test
if (require.main === module) {
  if (process.argv.includes('--examples')) {
    showAPIExamples();
  } else {
    testDynamicProductFetching();
  }
}

module.exports = { testDynamicProductFetching, showAPIExamples };
