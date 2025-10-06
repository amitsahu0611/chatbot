#!/usr/bin/env node

/**
 * AI-Powered Search Test Script
 * 
 * This script demonstrates how the AI query understanding works
 * to convert natural language to structured search terms.
 */

require('dotenv').config({ path: './config.env' });
const queryUnderstandingService = require('./src/services/queryUnderstandingService');
const { sequelize } = require('./src/config/database');
const { Product } = require('./src/models');
const { Op } = require('sequelize');

async function testAISearch() {
  try {
    console.log('🤖 Testing AI-Powered Product Search\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Get available categories and brands for AI context
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

    console.log('📊 Available Data:');
    console.log(`Categories: ${availableCategories.slice(0, 5).join(', ')}... (${availableCategories.length} total)`);
    console.log(`Brands: ${availableBrands.slice(0, 5).join(', ')}... (${availableBrands.length} total)`);
    console.log('');

    // Test queries that demonstrate AI understanding
    const testQueries = [
      "I need something warm for winter",
      "cheap Nike shoes for running", 
      "formal shirt for office men",
      "clothes for men",
      "affordable phone under 500 dollars",
      "luxury watch for women",
      "comfortable shoes for walking",
      "gaming laptop with good graphics",
      "casual wear for weekend",
      "professional attire for meetings"
    ];

    console.log('🧠 AI Query Understanding Tests:\n');

    for (const query of testQueries) {
      console.log(`🔍 Query: "${query}"`);
      
      try {
        const understood = await queryUnderstandingService.understandQuery(
          query, 
          availableCategories, 
          availableBrands
        );

        console.log(`   🎯 Intent: ${understood.intent}`);
        console.log(`   🔤 Search Terms: [${understood.searchTerms.join(', ')}]`);
        
        if (understood.category) console.log(`   📂 Category: ${understood.category}`);
        if (understood.gender) console.log(`   👤 Gender: ${understood.gender}`);
        if (understood.brand) console.log(`   🏷️  Brand: ${understood.brand}`);
        if (understood.priceRange) console.log(`   💰 Price Range: ${understood.priceRange}`);
        
        console.log(`   🤖 Processed by: ${understood.processedBy}`);

        // Build MeiliSearch query
        const searchQuery = queryUnderstandingService.buildMeiliSearchQuery(understood);
        console.log(`   🔧 Enhanced Query: "${searchQuery.query}"`);
        if (searchQuery.filters) {
          console.log(`   🎛️  Filters: ${searchQuery.filters}`);
        }

        // Get suggestions
        const suggestions = queryUnderstandingService.getSearchSuggestions(understood);
        if (suggestions.length > 0) {
          console.log(`   💡 Suggestions: [${suggestions.join(', ')}]`);
        }

        console.log('');

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        console.log('');
      }
    }

    console.log('🌐 API Usage Examples:\n');
    
    const baseUrl = 'http://localhost:30006/api/super-admin/product-search/search';
    
    console.log('1. Natural Language Search (AI Enhanced):');
    console.log(`   GET ${baseUrl}?q=I+need+something+warm+for+winter&limit=20&useAI=true\n`);
    
    console.log('2. Traditional Keyword Search (AI Disabled):');
    console.log(`   GET ${baseUrl}?q=jacket&limit=20&useAI=false\n`);
    
    console.log('3. Complex Natural Language Query:');
    console.log(`   GET ${baseUrl}?q=affordable+Nike+shoes+for+running&limit=20&useAI=true\n`);
    
    console.log('4. Formal Wear Query:');
    console.log(`   GET ${baseUrl}?q=formal+shirt+for+office+men&limit=20&useAI=true\n`);

    console.log('🎉 AI Search Testing Complete!\n');
    
    console.log('📋 How it works:');
    console.log('1. User enters natural language query');
    console.log('2. AI understands intent and extracts structured data');
    console.log('3. System builds optimized MeiliSearch query with filters');
    console.log('4. Returns relevant results with AI understanding metadata');

  } catch (error) {
    console.error('❌ Error testing AI search:', error);
  } finally {
    await sequelize.close();
  }
}

// Example response format
function showExampleResponse() {
  console.log('\n📄 Example API Response Format:\n');
  
  const exampleResponse = {
    "success": true,
    "data": {
      "query": "I need something warm for winter",
      "results": [
        {
          "id": 156,
          "product_name": "Men's Winter Jacket",
          "brand": "North Face",
          "category": "Clothing",
          "price": 129.99
        }
      ],
      "aiUnderstanding": {
        "originalQuery": "I need something warm for winter",
        "enhancedQuery": "jacket coat sweater hoodie winter",
        "intent": "warm winter clothing",
        "detectedCategory": "Clothing",
        "detectedGender": null,
        "detectedBrand": null,
        "detectedPriceRange": null,
        "searchTerms": ["jacket", "coat", "sweater", "hoodie", "winter"],
        "processedBy": "ai",
        "appliedFilters": "category = \"Clothing\"",
        "suggestions": ["winter jacket", "warm clothes", "sweater"]
      },
      "meta": {
        "aiEnhanced": true,
        "processingTimeMs": 15,
        "totalRequestTimeMs": 250
      }
    }
  };

  console.log(JSON.stringify(exampleResponse, null, 2));
}

// Run the test
if (require.main === module) {
  if (process.argv.includes('--example')) {
    showExampleResponse();
  } else {
    testAISearch();
  }
}

module.exports = { testAISearch, showExampleResponse };
