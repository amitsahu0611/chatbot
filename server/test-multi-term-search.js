#!/usr/bin/env node

/**
 * Multi-Term Search Test Script
 * 
 * This script demonstrates how the AI converts natural language to multiple search terms
 * and then searches each term individually to get comprehensive results.
 */

require('dotenv').config({ path: './config.env' });
const queryUnderstandingService = require('./src/services/queryUnderstandingService');
const meilisearchService = require('./src/services/meilisearchService');
const { sequelize } = require('./src/config/database');
const { Product } = require('./src/models');
const { Op } = require('sequelize');

async function testMultiTermSearch() {
  try {
    console.log('🔍 Testing Multi-Term Search Functionality\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Test queries that should generate multiple search terms
    const testQueries = [
      "lowers",
      "I need something warm for winter",
      "cheap Nike shoes for running",
      "formal shirt for office men",
      "comfortable clothes for workout"
    ];

    for (const query of testQueries) {
      console.log(`🔍 Testing Query: "${query}"`);
      console.log('─'.repeat(50));
      
      try {
        // Step 1: AI Understanding
        const [categories, brands] = await Promise.all([
          Product.findAll({
            attributes: ['category'],
            group: ['category'],
            where: { category: { [Op.ne]: null } },
            raw: true
          }),
          Product.findAll({
            attributes: ['brand'],
            group: ['brand'],
            where: { brand: { [Op.ne]: null } },
            raw: true
          })
        ]);

        const availableCategories = categories.map(c => c.category).filter(Boolean);
        const availableBrands = brands.map(b => b.brand).filter(Boolean);

        const understoodQuery = await queryUnderstandingService.understandQuery(
          query, 
          availableCategories, 
          availableBrands
        );

        console.log(`📝 AI Understanding:`);
        console.log(`   Original: "${understoodQuery.originalQuery}"`);
        console.log(`   Intent: ${understoodQuery.intent}`);
        console.log(`   Search Terms: [${understoodQuery.searchTerms.join(', ')}]`);
        if (understoodQuery.category) console.log(`   Category: ${understoodQuery.category}`);
        if (understoodQuery.gender) console.log(`   Gender: ${understoodQuery.gender}`);
        if (understoodQuery.brand) console.log(`   Brand: ${understoodQuery.brand}`);
        console.log(`   Processed by: ${understoodQuery.processedBy}`);
        console.log('');

        // Step 2: Build search options
        const searchQuery = queryUnderstandingService.buildMeiliSearchQuery(understoodQuery);
        
        const searchOptions = {
          limit: 12,
          offset: 0,
          filters: searchQuery.filters,
          enableHighlighting: false
        };

        // Add search terms for multi-term search
        if (understoodQuery.searchTerms && understoodQuery.searchTerms.length > 1) {
          searchOptions.searchTerms = understoodQuery.searchTerms;
        }

        console.log(`🔧 Search Configuration:`);
        console.log(`   Enhanced Query: "${searchQuery.query}"`);
        if (searchQuery.filters) console.log(`   Filters: ${searchQuery.filters}`);
        if (searchOptions.searchTerms) {
          console.log(`   Multi-term search: [${searchOptions.searchTerms.join(', ')}]`);
        }
        console.log('');

        // Step 3: Execute search
        const startTime = Date.now();
        const results = await meilisearchService.searchProducts(searchQuery.query, searchOptions);
        const searchTime = Date.now() - startTime;

        console.log(`📊 Search Results:`);
        console.log(`   Total Results: ${results.hits.length}`);
        console.log(`   Search Time: ${searchTime}ms`);
        console.log(`   Multi-term Search: ${results.multiTermSearch ? 'Yes' : 'No'}`);
        
        if (results.multiTermSearch && results.termResults) {
          console.log(`   Term Breakdown:`);
          results.termResults.forEach(tr => {
            console.log(`     "${tr.term}": ${tr.hitCount} results`);
          });
        }
        
        console.log('');

        // Step 4: Show sample results
        if (results.hits.length > 0) {
          console.log(`🎯 Sample Results (showing first 5):`);
          results.hits.slice(0, 5).forEach((product, index) => {
            let resultLine = `   ${index + 1}. ${product.product_name} - ${product.brand} (${product.category})`;
            
            // Show which terms matched (if multi-term search)
            if (product._matchedTerms && product._matchedTerms.length > 0) {
              resultLine += ` [matched: ${product._matchedTerms.join(', ')}]`;
            }
            
            console.log(resultLine);
          });
        } else {
          console.log(`❌ No results found`);
        }
        
        console.log('\n' + '='.repeat(70) + '\n');

      } catch (error) {
        console.log(`❌ Error testing query "${query}": ${error.message}\n`);
      }
    }

    console.log('🎉 Multi-term search testing completed!\n');
    
    console.log('📋 How Multi-Term Search Works:');
    console.log('1. AI converts "lowers" → ["lowers", "bottoms", "pants", "trousers"]');
    console.log('2. System searches each term individually in parallel');
    console.log('3. Results are combined and deduplicated');
    console.log('4. Products matching multiple terms get higher relevance');
    console.log('5. Final results are sorted by relevance and returned');
    
    console.log('\n🚀 API Usage:');
    console.log('GET /api/super-admin/product-search/search?q=lowers&useAI=true');
    console.log('→ Will automatically use multi-term search with AI-generated terms');

  } catch (error) {
    console.error('❌ Error testing multi-term search:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
if (require.main === module) {
  testMultiTermSearch();
}

module.exports = { testMultiTermSearch };

