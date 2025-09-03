#!/usr/bin/env node

// Simple script to run database optimizations
require('dotenv').config();
const { optimizePerformanceIndexes } = require('./src/migrations/optimize-performance-indexes.js');

async function runOptimization() {
  try {
    console.log('🚀 Starting database performance optimization...');
    await optimizePerformanceIndexes();
    console.log('✅ Database optimization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database optimization failed:', error.message);
    console.log('💡 This might be normal if indexes already exist or database is not accessible.');
    process.exit(1);
  }
}

runOptimization();
