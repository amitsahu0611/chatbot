const { MeiliSearch } = require('meilisearch');
const logger = require('../utils/logger');

// MeiliSearch configuration
const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || '';

// Initialize MeiliSearch client
const meiliClient = new MeiliSearch({
  host: MEILISEARCH_HOST,
  apiKey: MEILISEARCH_API_KEY,
});

// Product index configuration
const PRODUCTS_INDEX = 'products';

const initializeMeiliSearch = async () => {
  try {
    // Check if MeiliSearch is accessible
    const health = await meiliClient.health();
    logger.info('MeiliSearch is healthy:', health);

    // Create products index if it doesn't exist
    try {
      await meiliClient.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' });
      logger.info(`Created MeiliSearch index: ${PRODUCTS_INDEX}`);
    } catch (error) {
      if (error.code === 'index_already_exists') {
        logger.info(`MeiliSearch index ${PRODUCTS_INDEX} already exists`);
      } else {
        throw error;
      }
    }

    // Get the products index
    const productsIndex = meiliClient.index(PRODUCTS_INDEX);

    // Configure searchable attributes
    await productsIndex.updateSearchableAttributes([
      'product_name',
      'description',
      'brand',
      'category',
      'gender'
    ]);

    // Configure filterable attributes
    await productsIndex.updateFilterableAttributes([
      'brand',
      'category',
      'gender',
      'price',
      'stock_quantity',
      'price_range',
      'stock_status',
      'is_available'
    ]);

    // Configure sortable attributes
    await productsIndex.updateSortableAttributes([
      'product_name',
      'price',
      'stock_quantity',
      'created_at'
    ]);

    // Configure optimized ranking rules for better performance
    await productsIndex.updateRankingRules([
      'words',
      'typo',
      'attribute',
      'sort',
      'exactness'
    ]);

    // Configure synonyms for better search experience (reduced for performance)
    await productsIndex.updateSynonyms({
      'phone': ['smartphone', 'mobile'],
      'shoes': ['sneakers', 'footwear'],
      'shirt': ['t-shirt', 'tee', 'polo'],
      'jeans': ['pants', 'denim', 'trousers'],
      'clothes': ['clothing', 'apparel', 'garments'],
      'men': ['male', 'mens', 'man'],
      'women': ['female', 'womens', 'woman'],
      'jacket': ['coat', 'hoodie', 'sweatshirt']
    });

    // Configure typo tolerance for better performance
    await productsIndex.updateTypoTolerance({
      enabled: true,
      minWordSizeForTypos: {
        oneTypo: 4,    // Reduced from default 5
        twoTypos: 8    // Reduced from default 9
      },
      disableOnWords: [],
      disableOnAttributes: []
    });

    // Configure pagination settings for better performance
    await productsIndex.updatePagination({
      maxTotalHits: 1000  // Limit total hits for better performance
    });

    logger.info('MeiliSearch configuration completed successfully');
    return productsIndex;

  } catch (error) {
    logger.error('Failed to initialize MeiliSearch:', error);
    throw error;
  }
};

// Get products index
const getProductsIndex = () => {
  return meiliClient.index(PRODUCTS_INDEX);
};

module.exports = {
  meiliClient,
  initializeMeiliSearch,
  getProductsIndex,
  PRODUCTS_INDEX
};
