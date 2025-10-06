#!/usr/bin/env node

/**
 * Pagination Test Script
 * 
 * This script demonstrates how the product search pagination works
 * with 20 products per page and proper navigation.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:30006';
const API_ENDPOINT = '/api/super-admin/product-search/search';

// You'll need to replace this with a valid JWT token
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

async function testPagination() {
  console.log('🔍 Testing Product Search Pagination\n');
  
  try {
    // Test 1: First page (20 products)
    console.log('📄 Page 1 - First 20 products:');
    const page1Response = await makeRequest({
      q: 'jackets for men',
      limit: 20,
      offset: 0,
      highlight: false
    });
    
    displayPaginationInfo(page1Response.data, 1);
    
    // Test 2: Second page (next 20 products)
    if (page1Response.data.pagination.hasMore) {
      console.log('\n📄 Page 2 - Next 20 products:');
      const page2Response = await makeRequest({
        q: 'jackets for men',
        limit: 20,
        offset: 20,
        highlight: false
      });
      
      displayPaginationInfo(page2Response.data, 2);
      
      // Test 3: Third page (if available)
      if (page2Response.data.pagination.hasMore) {
        console.log('\n📄 Page 3 - Next 20 products:');
        const page3Response = await makeRequest({
          q: 'jackets for men',
          limit: 20,
          offset: 40,
          highlight: false
        });
        
        displayPaginationInfo(page3Response.data, 3);
      }
    }
    
    // Test 4: Different page sizes
    console.log('\n🔢 Testing different page sizes:');
    
    const sizes = [10, 15, 25, 50];
    for (const size of sizes) {
      const response = await makeRequest({
        q: 'shoes',
        limit: size,
        offset: 0,
        highlight: false
      });
      
      console.log(`  ${size} per page: Got ${response.data.results.length} results, Total: ${response.data.pagination.totalHits}`);
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('❌ Authentication failed. Please update AUTH_TOKEN in the script.');
    } else {
      console.error('❌ Error testing pagination:', error.message);
    }
  }
}

async function makeRequest(params) {
  const url = `${BASE_URL}${API_ENDPOINT}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    },
    params
  };
  
  const response = await axios.get(url, config);
  return response.data;
}

function displayPaginationInfo(data, pageNum) {
  const { results, pagination, meta } = data;
  
  console.log(`  Results: ${results.length} products`);
  console.log(`  Current Page: ${pagination.currentPage} of ${pagination.totalPages}`);
  console.log(`  Total Products: ${pagination.totalHits}`);
  console.log(`  Offset: ${pagination.offset}, Limit: ${pagination.limit}`);
  console.log(`  Has More: ${pagination.hasMore ? '✅' : '❌'}`);
  console.log(`  Has Previous: ${pagination.hasPrevious ? '✅' : '❌'}`);
  console.log(`  Performance: ${meta.totalRequestTimeMs}ms ${meta.fromCache ? '(cached)' : '(fresh)'}`);
  
  if (pagination.nextPageUrl) {
    console.log(`  Next Page URL: ${pagination.nextPageUrl}`);
  }
  if (pagination.previousPageUrl) {
    console.log(`  Previous Page URL: ${pagination.previousPageUrl}`);
  }
  
  // Show first few product names
  if (results.length > 0) {
    console.log('  Sample products:');
    results.slice(0, 3).forEach((product, index) => {
      console.log(`    ${index + 1}. ${product.product_name} - $${product.price}`);
    });
    if (results.length > 3) {
      console.log(`    ... and ${results.length - 3} more`);
    }
  }
}

// Example usage functions
function generateExampleUrls() {
  console.log('\n📋 Example API URLs for pagination:\n');
  
  const baseUrl = `${BASE_URL}${API_ENDPOINT}`;
  const query = 'jackets for men';
  
  console.log('Page 1 (first 20):');
  console.log(`${baseUrl}?q=${encodeURIComponent(query)}&limit=20&offset=0&highlight=false\n`);
  
  console.log('Page 2 (next 20):');
  console.log(`${baseUrl}?q=${encodeURIComponent(query)}&limit=20&offset=20&highlight=false\n`);
  
  console.log('Page 3 (next 20):');
  console.log(`${baseUrl}?q=${encodeURIComponent(query)}&limit=20&offset=40&highlight=false\n`);
  
  console.log('With sorting by name:');
  console.log(`${baseUrl}?q=${encodeURIComponent(query)}&limit=20&offset=0&sort=product_name:asc&highlight=false\n`);
  
  console.log('With highlighting enabled:');
  console.log(`${baseUrl}?q=${encodeURIComponent(query)}&limit=20&offset=0&highlight=true\n`);
}

// Run the test
if (require.main === module) {
  if (process.argv.includes('--examples')) {
    generateExampleUrls();
  } else {
    console.log('To test pagination with actual API calls, update AUTH_TOKEN and run:');
    console.log('node test-pagination.js\n');
    console.log('To see example URLs only, run:');
    console.log('node test-pagination.js --examples\n');
    
    if (process.argv.includes('--run')) {
      testPagination();
    } else {
      generateExampleUrls();
    }
  }
}

module.exports = { testPagination, generateExampleUrls };
