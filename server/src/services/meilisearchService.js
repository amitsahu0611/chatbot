const { getProductsIndex } = require('../config/meilisearch');
const { Product } = require('../models');
const logger = require('../utils/logger');

class MeiliSearchService {
  constructor() {
    this.productsIndex = getProductsIndex();
    // Simple in-memory cache for search results
    this.searchCache = new Map();
    this.cacheMaxSize = 100; // Maximum number of cached queries
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes TTL
  }

  // Generate cache key from search parameters
  generateCacheKey(query, options) {
    return JSON.stringify({ query, options });
  }

  // Get cached search result
  getCachedResult(cacheKey) {
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    // Remove expired cache entry
    if (cached) {
      this.searchCache.delete(cacheKey);
    }
    return null;
  }

  // Cache search result
  setCachedResult(cacheKey, data) {
    // Implement LRU-like behavior by removing oldest entries when cache is full
    if (this.searchCache.size >= this.cacheMaxSize) {
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
    
    this.searchCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  // Add a single product to MeiliSearch
  async addProduct(product) {
    try {
      const productData = this.formatProductForIndex(product);
      const result = await this.productsIndex.addDocuments([productData]);
      logger.info(`Added product to MeiliSearch: ${product.product_name} (ID: ${product.id})`);
      return result;
    } catch (error) {
      logger.error('Error adding product to MeiliSearch:', error);
      throw error;
    }
  }

  // Update a product in MeiliSearch
  async updateProduct(product) {
    try {
      const productData = this.formatProductForIndex(product);
      const result = await this.productsIndex.addDocuments([productData]);
      logger.info(`Updated product in MeiliSearch: ${product.product_name} (ID: ${product.id})`);
      return result;
    } catch (error) {
      logger.error('Error updating product in MeiliSearch:', error);
      throw error;
    }
  }

  // Delete a product from MeiliSearch
  async deleteProduct(productId) {
    try {
      const result = await this.productsIndex.deleteDocument(productId);
      logger.info(`Deleted product from MeiliSearch: ID ${productId}`);
      return result;
    } catch (error) {
      logger.error('Error deleting product from MeiliSearch:', error);
      throw error;
    }
  }

  // Sync all products from database to MeiliSearch
  async syncAllProducts() {
    try {
      logger.info('Starting product sync to MeiliSearch...');
      
      // Get all products from database
      const products = await Product.findAll();
      
      if (products.length === 0) {
        logger.info('No products found to sync');
        return { success: true, count: 0 };
      }

      // Format products for MeiliSearch
      const formattedProducts = products.map(product => this.formatProductForIndex(product));

      // Add all products to MeiliSearch
      const result = await this.productsIndex.addDocuments(formattedProducts);
      
      logger.info(`Successfully synced ${products.length} products to MeiliSearch`);
      return { success: true, count: products.length, taskUid: result.taskUid };
      
    } catch (error) {
      logger.error('Error syncing products to MeiliSearch:', error);
      throw error;
    }
  }

  // Search products using MeiliSearch with multiple search terms
  async searchProducts(query, options = {}) {
    try {
      const startTime = Date.now();
      
      const {
        limit = 20,
        offset = 0,
        filters = '',
        sort = [],
        attributesToHighlight = [],
        attributesToCrop = [],
        cropLength = 50,
        enableHighlighting = false,
        searchTerms = null // New option for multiple search terms
      } = options;

      // Check cache first for non-highlighting queries
      const cacheKey = this.generateCacheKey(query, options);
      if (!enableHighlighting) {
        const cachedResult = this.getCachedResult(cacheKey);
        if (cachedResult) {
          logger.info(`Cache hit for query: "${query}" - returned in ${Date.now() - startTime}ms`);
          return {
            ...cachedResult,
            fromCache: true,
            totalProcessingTimeMs: Date.now() - startTime
          };
        }
      }

      // If we have multiple search terms, search each one and combine results
      if (searchTerms && Array.isArray(searchTerms) && searchTerms.length > 1) {
        return await this.searchMultipleTerms(searchTerms, options, startTime);
      }

      // Single term search (original logic)
      return await this.performSingleSearch(query, options, startTime);
      
    } catch (error) {
      logger.error('Error searching products in MeiliSearch:', error);
      throw error;
    }
  }

  // Search multiple terms and combine results
  async searchMultipleTerms(searchTerms, options, startTime) {
    const {
      limit = 20,
      offset = 0,
      filters = '',
      sort = [],
      attributesToHighlight = [],
      attributesToCrop = [],
      cropLength = 50,
      enableHighlighting = false
    } = options;

    logger.info(`Searching multiple terms: [${searchTerms.join(', ')}]`);

    // Search each term individually
    const searchPromises = searchTerms.map(async (term, index) => {
      try {
        const termResult = await this.performSingleSearch(term, {
          ...options,
          limit: limit * 2, // Get more results per term to ensure we have enough
          offset: 0, // Always start from 0 for individual term searches
          searchTerms: null // Prevent infinite recursion
        }, startTime);

        // Add relevance score based on term position (first terms are more relevant)
        const relevanceBoost = searchTerms.length - index;
        termResult.hits = termResult.hits.map(hit => ({
          ...hit,
          _termRelevance: relevanceBoost,
          _searchTerm: term
        }));

        return {
          term,
          results: termResult,
          hitCount: termResult.hits.length
        };
      } catch (error) {
        logger.error(`Error searching term "${term}":`, error);
        return {
          term,
          results: { hits: [] },
          hitCount: 0
        };
      }
    });

    const termResults = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    const combinedHits = new Map();
    let totalEstimatedHits = 0;

    termResults.forEach(({ term, results, hitCount }) => {
      logger.info(`Term "${term}" returned ${hitCount} results`);
      totalEstimatedHits = Math.max(totalEstimatedHits, results.estimatedTotalHits || results.totalHits || 0);
      
      results.hits.forEach(hit => {
        const existingHit = combinedHits.get(hit.id);
        if (existingHit) {
          // Boost relevance if product matches multiple terms
          existingHit._termRelevance += hit._termRelevance;
          existingHit._matchedTerms = [...(existingHit._matchedTerms || [existingHit._searchTerm]), hit._searchTerm];
        } else {
          combinedHits.set(hit.id, {
            ...hit,
            _matchedTerms: [hit._searchTerm]
          });
        }
      });
    });

    // Convert to array and sort by relevance
    let finalHits = Array.from(combinedHits.values());
    
    // Sort by relevance (products matching multiple terms first, then by term relevance)
    finalHits.sort((a, b) => {
      const aTermCount = a._matchedTerms.length;
      const bTermCount = b._matchedTerms.length;
      
      if (aTermCount !== bTermCount) {
        return bTermCount - aTermCount; // More matched terms = higher relevance
      }
      
      return b._termRelevance - a._termRelevance; // Higher term relevance = higher position
    });

    // Apply pagination
    const paginatedHits = finalHits.slice(offset, offset + limit);

    const processingTime = Date.now() - startTime;
    logger.info(`Multi-term search completed: ${finalHits.length} unique results in ${processingTime}ms`);

    const formattedResults = {
      hits: paginatedHits,
      query: searchTerms.join(' '),
      processingTimeMs: processingTime,
      totalProcessingTimeMs: processingTime,
      limit,
      offset,
      estimatedTotalHits: finalHits.length,
      totalHits: finalHits.length,
      totalPages: Math.ceil(finalHits.length / limit),
      hitsPerPage: limit,
      page: Math.floor(offset / limit) + 1,
      facetDistribution: {},
      facetStats: {},
      fromCache: false,
      multiTermSearch: true,
      searchTermsUsed: searchTerms,
      termResults: termResults.map(r => ({ term: r.term, hitCount: r.hitCount }))
    };

    return formattedResults;
  }

  // Perform single search (extracted from original logic)
  async performSingleSearch(query, options, startTime) {
    const {
      limit = 20,
      offset = 0,
      filters = '',
      sort = [],
      attributesToHighlight = [],
      attributesToCrop = [],
      cropLength = 50,
      enableHighlighting = false
    } = options;

    // Build minimal search options for better performance
    const searchOptions = {
      limit,
      offset,
      // Only include attributes we actually need
      attributesToRetrieve: ['id', 'product_name', 'description', 'price', 'brand', 'category', 'gender', 'stock_quantity', 'image_url']
    };

    // Only add highlighting if explicitly requested and needed
    if (enableHighlighting && attributesToHighlight.length > 0) {
      searchOptions.attributesToHighlight = attributesToHighlight;
      searchOptions.highlightPreTag = '<mark>';
      searchOptions.highlightPostTag = '</mark>';
      
      // Only add cropping if highlighting is enabled
      if (attributesToCrop.length > 0) {
        searchOptions.attributesToCrop = attributesToCrop;
        searchOptions.cropLength = cropLength;
      }
    }

    // Add filters if provided
    if (filters) {
      searchOptions.filter = filters;
    }

    // Add sorting if provided
    if (sort.length > 0) {
      searchOptions.sort = sort;
    }

    const results = await this.productsIndex.search(query, searchOptions);
    
    const processingTime = Date.now() - startTime;
    
    const formattedResults = {
      hits: results.hits,
      query: results.query,
      processingTimeMs: results.processingTimeMs,
      totalProcessingTimeMs: processingTime,
      limit: results.limit,
      offset: results.offset,
      estimatedTotalHits: results.estimatedTotalHits,
      totalHits: results.totalHits,
      totalPages: results.totalPages,
      hitsPerPage: results.hitsPerPage,
      page: results.page,
      facetDistribution: results.facetDistribution,
      facetStats: results.facetStats,
      fromCache: false
    };

    // Cache non-highlighting results for better performance
    if (!enableHighlighting) {
      this.setCachedResult(this.generateCacheKey(query, options), formattedResults);
    }

    return formattedResults;
  }

  // Get search suggestions/autocomplete
  async getSearchSuggestions(query, limit = 5) {
    try {
      const results = await this.productsIndex.search(query, {
        limit,
        attributesToRetrieve: ['product_name', 'brand', 'category'],
        attributesToHighlight: ['product_name'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>'
      });

      return results.hits.map(hit => ({
        id: hit.id,
        suggestion: hit.product_name,
        brand: hit.brand,
        category: hit.category,
        highlighted: hit._formatted?.product_name || hit.product_name
      }));
      
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      throw error;
    }
  }

  // Get faceted search data (for filters)
  async getFacetedSearch(query = '', facets = ['brand', 'category', 'gender']) {
    try {
      const results = await this.productsIndex.search(query, {
        limit: 0, // We only want facet data
        facets
      });

      return {
        facetDistribution: results.facetDistribution,
        facetStats: results.facetStats,
        totalHits: results.estimatedTotalHits
      };
      
    } catch (error) {
      logger.error('Error getting faceted search data:', error);
      throw error;
    }
  }

  // Get MeiliSearch index stats
  async getIndexStats() {
    try {
      const stats = await this.productsIndex.getStats();
      return stats;
    } catch (error) {
      logger.error('Error getting MeiliSearch index stats:', error);
      throw error;
    }
  }

  // Clear all documents from the index
  async clearIndex() {
    try {
      const result = await this.productsIndex.deleteAllDocuments();
      logger.info('Cleared all products from MeiliSearch index');
      return result;
    } catch (error) {
      logger.error('Error clearing MeiliSearch index:', error);
      throw error;
    }
  }

  // Format product data for MeiliSearch indexing
  formatProductForIndex(product) {
    return {
      id: product.id,
      product_name: product.product_name,
      description: product.description || '',
      price: parseFloat(product.price) || 0,
      brand: product.brand || '',
      category: product.category || '',
      gender: product.gender || '',
      stock_quantity: parseInt(product.stock_quantity) || 0,
      image_url: product.image_url || '',
      created_at: product.created_at || new Date(),
      // Additional searchable fields
      searchable_text: [
        product.product_name,
        product.description,
        product.brand,
        product.category,
        product.gender
      ].filter(Boolean).join(' ').toLowerCase(),
      // Price ranges for filtering
      price_range: this.getPriceRange(parseFloat(product.price) || 0),
      // Stock status
      stock_status: this.getStockStatus(parseInt(product.stock_quantity) || 0),
      // Availability
      is_available: (parseInt(product.stock_quantity) || 0) > 0
    };
  }

  // Helper method to categorize price ranges
  getPriceRange(price) {
    if (price === 0) return 'free';
    if (price < 25) return 'under_25';
    if (price < 50) return '25_to_50';
    if (price < 100) return '50_to_100';
    if (price < 250) return '100_to_250';
    if (price < 500) return '250_to_500';
    return 'over_500';
  }

  // Helper method to categorize stock status
  getStockStatus(quantity) {
    if (quantity === 0) return 'out_of_stock';
    if (quantity < 5) return 'low_stock';
    if (quantity < 20) return 'medium_stock';
    return 'high_stock';
  }
}

module.exports = new MeiliSearchService();
