const meilisearchService = require('../../services/meilisearchService');
const queryUnderstandingService = require('../../services/queryUnderstandingService');
const { Product } = require('../../models');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');

const productSearchController = {
  // Search products using MeiliSearch
  searchProducts: async (req, res) => {
    const requestStartTime = Date.now();
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const {
        q: query = '',
        limit = 20,
        offset = 0,
        filters = '',
        sort = [],
        highlight = true,
        useAI = true // New parameter to enable/disable AI understanding
      } = req.query;

      let finalQuery = query;
      let finalFilters = filters;
      let understoodQuery = null;
      let searchSuggestions = [];

      // Use AI to understand the query if enabled and query is provided
      if (useAI !== 'false' && query.trim()) {
        try {
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

          // Use AI to understand the query
          understoodQuery = await queryUnderstandingService.understandQuery(
            query, 
            availableCategories, 
            availableBrands
          );

          // Build enhanced search query
          const enhancedSearch = queryUnderstandingService.buildMeiliSearchQuery(understoodQuery);
          finalQuery = enhancedSearch.query;
          
          // Combine AI filters with existing filters
          if (enhancedSearch.filters && !filters) {
            finalFilters = enhancedSearch.filters;
          } else if (enhancedSearch.filters && filters) {
            finalFilters = `${filters} AND ${enhancedSearch.filters}`;
          }

          // Get search suggestions
          searchSuggestions = queryUnderstandingService.getSearchSuggestions(understoodQuery);

          logger.info(`AI Enhanced Search - Original: "${query}" -> Enhanced: "${finalQuery}" with filters: "${finalFilters}"`);

        } catch (aiError) {
          logger.error('AI query understanding failed, using original query:', aiError);
          // Continue with original query if AI fails
        }
      }

      const searchOptions = {
        limit: parseInt(limit),
        offset: parseInt(offset),
        filters: finalFilters,
        sort: Array.isArray(sort) ? sort : (sort ? [sort] : []),
        enableHighlighting: highlight === 'true' || highlight === true
      };

      // Add search terms for multi-term search if AI understanding provided them
      if (understoodQuery && understoodQuery.searchTerms && understoodQuery.searchTerms.length > 1) {
        searchOptions.searchTerms = understoodQuery.searchTerms;
        logger.info(`Using multi-term search with terms: [${understoodQuery.searchTerms.join(', ')}]`);
      }

      // Only add highlighting attributes if highlighting is enabled
      if (searchOptions.enableHighlighting) {
        searchOptions.attributesToHighlight = ['product_name', 'brand'];
        searchOptions.attributesToCrop = ['description'];
        searchOptions.cropLength = 50; // Reduced from 100 for better performance
      }

      const results = await meilisearchService.searchProducts(finalQuery, searchOptions);
      
      const totalRequestTime = Date.now() - requestStartTime;
      
      // Log performance metrics
      logger.info(`Search API Performance - Query: "${query}", Total: ${totalRequestTime}ms, MeiliSearch: ${results.processingTimeMs}ms, Cache: ${results.fromCache ? 'HIT' : 'MISS'}`);

      const totalHits = results.estimatedTotalHits || results.totalHits || 0;
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);
      const currentPage = Math.floor(offsetNum / limitNum) + 1;
      const totalPages = Math.ceil(totalHits / limitNum);

      res.json({
        success: true,
        data: {
          query,
          results: results.hits,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            totalHits: totalHits,
            totalPages: totalPages,
            currentPage: currentPage,
            hasMore: (offsetNum + limitNum) < totalHits,
            hasPrevious: offsetNum > 0,
            nextOffset: (offsetNum + limitNum) < totalHits ? offsetNum + limitNum : null,
            previousOffset: offsetNum > 0 ? Math.max(0, offsetNum - limitNum) : null,
            // Helper URLs for easy pagination
            nextPageUrl: (offsetNum + limitNum) < totalHits ? 
              `?q=${encodeURIComponent(query)}&limit=${limitNum}&offset=${offsetNum + limitNum}&sort=${Array.isArray(sort) ? sort.join(',') : sort}&highlight=${highlight}` : null,
            previousPageUrl: offsetNum > 0 ? 
              `?q=${encodeURIComponent(query)}&limit=${limitNum}&offset=${Math.max(0, offsetNum - limitNum)}&sort=${Array.isArray(sort) ? sort.join(',') : sort}&highlight=${highlight}` : null
          },
          // AI Understanding Information
          aiUnderstanding: understoodQuery ? {
            originalQuery: query,
            enhancedQuery: finalQuery,
            intent: understoodQuery.intent,
            detectedCategory: understoodQuery.category,
            detectedGender: understoodQuery.gender,
            detectedBrand: understoodQuery.brand,
            detectedPriceRange: understoodQuery.priceRange,
            searchTerms: understoodQuery.searchTerms,
            processedBy: understoodQuery.processedBy,
            appliedFilters: finalFilters || null,
            suggestions: searchSuggestions
          } : null,
          meta: {
            processingTimeMs: results.processingTimeMs,
            totalRequestTimeMs: totalRequestTime,
            fromCache: results.fromCache,
            facetDistribution: results.facetDistribution,
            facetStats: results.facetStats,
            aiEnhanced: !!understoodQuery,
            multiTermSearch: results.multiTermSearch || false,
            searchTermsUsed: results.searchTermsUsed || null,
            termResults: results.termResults || null
          }
        }
      });

    } catch (error) {
      logger.error('Error in product search:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search products',
        error: error.message
      });
    }
  },

  // Get search suggestions/autocomplete
  getSearchSuggestions: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const { q: query = '', limit = 5 } = req.query;

      if (!query.trim()) {
        return res.json({
          success: true,
          data: []
        });
      }

      const suggestions = await meilisearchService.getSearchSuggestions(query, parseInt(limit));

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get search suggestions',
        error: error.message
      });
    }
  },

  // Get faceted search data for filters
  getFacetedSearch: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const { q: query = '', facets = 'brand,category,gender,price_range,stock_status' } = req.query;
      const facetArray = facets.split(',').map(f => f.trim());

      const facetData = await meilisearchService.getFacetedSearch(query, facetArray);

      res.json({
        success: true,
        data: facetData
      });

    } catch (error) {
      logger.error('Error getting faceted search data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get faceted search data',
        error: error.message
      });
    }
  },

  // Sync all products to MeiliSearch
  syncProducts: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const result = await meilisearchService.syncAllProducts();

      res.json({
        success: true,
        message: `Successfully synced ${result.count} products to MeiliSearch`,
        data: result
      });

    } catch (error) {
      logger.error('Error syncing products to MeiliSearch:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync products to MeiliSearch',
        error: error.message
      });
    }
  },

  // Get MeiliSearch index statistics
  getIndexStats: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const stats = await meilisearchService.getIndexStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting MeiliSearch index stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get index statistics',
        error: error.message
      });
    }
  },

  // Clear MeiliSearch index
  clearIndex: async (req, res) => {
    try {
      // Check if user is super admin
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Super admin privileges required.'
        });
      }

      const result = await meilisearchService.clearIndex();

      res.json({
        success: true,
        message: 'Successfully cleared MeiliSearch index',
        data: result
      });

    } catch (error) {
      logger.error('Error clearing MeiliSearch index:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear index',
        error: error.message
      });
    }
  }
};

module.exports = productSearchController;
