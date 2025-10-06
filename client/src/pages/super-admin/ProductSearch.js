import React, { useState, useEffect, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
  SparklesIcon,
  XMarkIcon,
  TagIcon,
  CurrencyDollarIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { API_URL } from '../../utils/config';

const ProductSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [facetData, setFacetData] = useState({});
  const [indexStats, setIndexStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalHits, setTotalHits] = useState(0);
  const [processingTime, setProcessingTime] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState({
    brand: [],
    category: [],
    gender: [],
    price_range: [],
    stock_status: []
  });

  const itemsPerPage = 12;

  // Fetch search suggestions with debouncing
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setSuggestionsLoading(true);
      const response = await fetch(`${API_URL}/api/super-admin/product-search/suggestions?q=${encodeURIComponent(query)}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.data);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchSuggestions]);

  // Fetch search results
  const performSearch = async (query = searchQuery, page = 1, filters = selectedFilters) => {
    try {
      setLoading(true);
      const offset = (page - 1) * itemsPerPage;
      
      // Build filter string for MeiliSearch
      const filterParts = [];
      Object.entries(filters).forEach(([key, values]) => {
        if (values.length > 0) {
          const filterValues = values.map(value => `${key} = "${value}"`).join(' OR ');
          if (filterValues) {
            filterParts.push(`(${filterValues})`);
          }
        }
      });
      const filterString = filterParts.join(' AND ');

      const queryParams = new URLSearchParams({
        q: query,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        ...(filterString && { filters: filterString }),
        sort: 'product_name:asc',
        highlight: 'true'
      });

      const response = await fetch(`${API_URL}/api/super-admin/product-search/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data.results);
        setTotalHits(data.data.pagination.totalHits);
        setProcessingTime(data.data.meta.processingTimeMs);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch facet data for filters
  const fetchFacetData = async (query = '') => {
    try {
      const response = await fetch(`${API_URL}/api/super-admin/product-search/facets?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFacetData(data.data.facetDistribution || {});
      }
    } catch (error) {
      console.error('Error fetching facet data:', error);
    }
  };

  // Fetch index statistics
  const fetchIndexStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/super-admin/product-search/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIndexStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching index stats:', error);
    }
  };

  // Sync products to MeiliSearch
  const syncProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/super-admin/product-search/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully synced ${data.data.count} products to MeiliSearch!`);
        fetchIndexStats();
        if (searchQuery) {
          performSearch();
        }
      }
    } catch (error) {
      console.error('Error syncing products:', error);
      alert('Error syncing products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    performSearch(searchQuery, 1);
    setShowSuggestions(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.suggestion);
    setShowSuggestions(false);
    performSearch(suggestion.suggestion, 1);
  };

  // Handle filter change
  const handleFilterChange = (filterType, value, checked) => {
    const newFilters = { ...selectedFilters };
    if (checked) {
      newFilters[filterType] = [...newFilters[filterType], value];
    } else {
      newFilters[filterType] = newFilters[filterType].filter(v => v !== value);
    }
    setSelectedFilters(newFilters);
    setCurrentPage(1);
    performSearch(searchQuery, 1, newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({
      brand: [],
      category: [],
      gender: [],
      price_range: [],
      stock_status: []
    });
    setCurrentPage(1);
    performSearch(searchQuery, 1, {
      brand: [],
      category: [],
      gender: [],
      price_range: [],
      stock_status: []
    });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    performSearch(searchQuery, page);
  };

  // Initialize component
  useEffect(() => {
    fetchIndexStats();
    fetchFacetData();
  }, []);

  // Update facet data when search query changes
  useEffect(() => {
    fetchFacetData(searchQuery);
  }, [searchQuery]);

  const totalPages = Math.ceil(totalHits / itemsPerPage);

  // Helper function to get price range label
  const getPriceRangeLabel = (range) => {
    const labels = {
      'free': 'Free',
      'under_25': 'Under $25',
      '25_to_50': '$25 - $50',
      '50_to_100': '$50 - $100',
      '100_to_250': '$100 - $250',
      '250_to_500': '$250 - $500',
      'over_500': 'Over $500'
    };
    return labels[range] || range;
  };

  // Helper function to get stock status label
  const getStockStatusLabel = (status) => {
    const labels = {
      'out_of_stock': 'Out of Stock',
      'low_stock': 'Low Stock',
      'medium_stock': 'Medium Stock',
      'high_stock': 'High Stock'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SparklesIcon className="h-8 w-8 text-blue-600" />
            Advanced Product Search
          </h1>
          <p className="text-gray-600">Powered by MeiliSearch for lightning-fast, intelligent product discovery</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={syncProducts}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Sync Products
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <CubeIcon className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-xl font-bold text-gray-900">{indexStats.numberOfDocuments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Search Results</p>
              <p className="text-xl font-bold text-gray-900">{totalHits}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Processing Time</p>
              <p className="text-xl font-bold text-gray-900">{processingTime}ms</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <TagIcon className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Active Filters</p>
              <p className="text-xl font-bold text-gray-900">
                {Object.values(selectedFilters).flat().length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Interface */}
      <div className="bg-white p-6 rounded-lg shadow">
        <form onSubmit={handleSearch} className="relative">
          <div className="flex gap-4 items-center mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products with AI-powered search... (try 'blue nike shoes' or 'smartphone under $500')"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              
              {/* Search Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      <div>
                        <div 
                          className="font-medium" 
                          dangerouslySetInnerHTML={{ __html: suggestion.highlighted }}
                        />
                        <div className="text-sm text-gray-500">
                          {suggestion.brand} • {suggestion.category}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-5 w-5" />
              )}
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <FunnelIcon className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear All Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Brand Filter */}
                {facetData.brand && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Brand</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {Object.entries(facetData.brand).map(([brand, count]) => (
                        <label key={brand} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFilters.brand.includes(brand)}
                            onChange={(e) => handleFilterChange('brand', brand, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{brand} ({count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Filter */}
                {facetData.category && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Category</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {Object.entries(facetData.category).map(([category, count]) => (
                        <label key={category} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFilters.category.includes(category)}
                            onChange={(e) => handleFilterChange('category', category, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{category} ({count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gender Filter */}
                {facetData.gender && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Gender</h4>
                    <div className="space-y-2">
                      {Object.entries(facetData.gender).map(([gender, count]) => (
                        <label key={gender} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFilters.gender.includes(gender)}
                            onChange={(e) => handleFilterChange('gender', gender, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{gender} ({count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Range Filter */}
                {facetData.price_range && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Price Range</h4>
                    <div className="space-y-2">
                      {Object.entries(facetData.price_range).map(([range, count]) => (
                        <label key={range} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFilters.price_range.includes(range)}
                            onChange={(e) => handleFilterChange('price_range', range, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{getPriceRangeLabel(range)} ({count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock Status Filter */}
                {facetData.stock_status && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Stock Status</h4>
                    <div className="space-y-2">
                      {Object.entries(facetData.stock_status).map(([status, count]) => (
                        <label key={status} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedFilters.stock_status.includes(status)}
                            onChange={(e) => handleFilterChange('stock_status', status, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{getStockStatusLabel(status)} ({count})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Search Results */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching products...</p>
          </div>
        ) : searchResults.length === 0 && searchQuery ? (
          <div className="p-8 text-center">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No products found for "{searchQuery}"</p>
            <p className="text-sm text-gray-500 mt-2">Try different keywords or remove some filters</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="p-8 text-center">
            <SparklesIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Start typing to search through our product catalog</p>
            <p className="text-sm text-gray-500 mt-2">Try searching for brands, categories, or product names</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Search Results {searchQuery && `for "${searchQuery}"`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Found {totalHits} products in {processingTime}ms
                  </p>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((product) => (
                  <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="p-4">
                      <h4 
                        className="font-medium text-gray-900 mb-2"
                        dangerouslySetInnerHTML={{ 
                          __html: product._formatted?.product_name || product.product_name 
                        }}
                      />
                      {product.description && (
                        <p 
                          className="text-sm text-gray-600 mb-2 line-clamp-2"
                          dangerouslySetInnerHTML={{ 
                            __html: product._formatted?.description || product.description 
                          }}
                        />
                      )}
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold text-gray-900">
                          {product.price ? `$${parseFloat(product.price).toFixed(2)}` : 'N/A'}
                        </span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock_quantity > 10 
                            ? 'bg-green-100 text-green-800'
                            : product.stock_quantity > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock_quantity} in stock
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: product._formatted?.brand || product.brand || 'No brand'
                          }}
                        />
                        <span>{product.category || 'Uncategorized'}</span>
                      </div>
                      {product.gender && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {product.gender}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
