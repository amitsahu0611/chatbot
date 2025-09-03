const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const cache = {
  // Short-term cache for API responses (5 minutes)
  api: new NodeCache({ stdTTL: 300, checkperiod: 60 }),
  
  // Medium-term cache for stats (15 minutes)
  stats: new NodeCache({ stdTTL: 900, checkperiod: 120 }),
  
  // Long-term cache for configuration (1 hour)
  config: new NodeCache({ stdTTL: 3600, checkperiod: 300 })
};

/**
 * Cache middleware factory
 * @param {string} cacheType - Type of cache to use ('api', 'stats', 'config')
 * @param {number} customTTL - Custom TTL in seconds (optional)
 * @param {function} keyGenerator - Custom key generator function (optional)
 */
const cacheMiddleware = (cacheType = 'api', customTTL = null, keyGenerator = null) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    let cacheKey;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      // Default key generation: method:url:companyId:userId
      const companyId = req.user?.companyId || req.query.companyId || 'global';
      const userId = req.user?.id || 'anonymous';
      cacheKey = `${req.method}:${req.path}:${companyId}:${userId}:${JSON.stringify(req.query)}`;
    }

    // Try to get cached response
    const cacheInstance = cache[cacheType];
    const cachedResponse = cacheInstance.get(cacheKey);
    
    if (cachedResponse) {
      console.log(`🚀 Cache HIT for ${cacheKey}`);
      return res.json(cachedResponse);
    }

    // Store original json function
    const originalJson = res.json;

    // Override json function to cache the response
    res.json = function(data) {
      // Only cache successful responses
      if (data && data.success !== false) {
        const ttl = customTTL || (cacheInstance.options.stdTTL);
        cacheInstance.set(cacheKey, data, ttl);
        console.log(`💾 Cache SET for ${cacheKey} (TTL: ${ttl}s)`);
      }
      
      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Pattern to match cache keys
 * @param {string} cacheType - Type of cache to clear
 */
const clearCacheByPattern = (pattern, cacheType = 'api') => {
  const cacheInstance = cache[cacheType];
  const keys = cacheInstance.keys();
  
  const keysToDelete = keys.filter(key => key.includes(pattern));
  keysToDelete.forEach(key => cacheInstance.del(key));
  
  console.log(`🗑️ Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  return keysToDelete.length;
};

/**
 * Clear cache for specific company
 * @param {number} companyId - Company ID to clear cache for
 */
const clearCompanyCache = (companyId) => {
  const pattern = `:${companyId}:`;
  let totalCleared = 0;
  
  Object.keys(cache).forEach(cacheType => {
    totalCleared += clearCacheByPattern(pattern, cacheType);
  });
  
  return totalCleared;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  const stats = {};
  
  Object.keys(cache).forEach(cacheType => {
    const cacheInstance = cache[cacheType];
    stats[cacheType] = {
      keys: cacheInstance.keys().length,
      hits: cacheInstance.getStats().hits,
      misses: cacheInstance.getStats().misses,
      deletes: cacheInstance.getStats().del,
      vsize: cacheInstance.getStats().vsize
    };
  });
  
  return stats;
};

module.exports = {
  cache,
  cacheMiddleware,
  clearCacheByPattern,
  clearCompanyCache,
  getCacheStats
};
