const OpenAI = require('openai');
const logger = require('../utils/logger');

class QueryUnderstandingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.isConfigured = process.env.OPENAI_API_KEY && 
                       process.env.OPENAI_API_KEY !== 'your-openai-api-key-here' && 
                       process.env.OPENAI_API_KEY.length > 20;
  }

  /**
   * Convert natural language query to structured search terms
   */
  async understandQuery(userQuery, availableCategories = [], availableBrands = []) {
    try {
      if (!this.isConfigured) {
        logger.warn('OpenAI not configured, using fallback query processing');
        return this.fallbackQueryProcessing(userQuery);
      }

      const systemPrompt = `You are an intelligent product search assistant. Your job is to understand natural language queries and convert them to structured search terms for an e-commerce product search.

Available Categories: ${availableCategories.join(', ')}
Available Brands: ${availableBrands.join(', ')}

CRITICAL INSTRUCTIONS:
1. Analyze the user's natural language query
2. Extract search intent and convert to relevant product search terms
3. Return ONLY a JSON object with the following structure:
{
  "searchTerms": ["term1", "term2", "term3"],
  "category": "category_name_or_null",
  "gender": "Male|Female|Unisex|null",
  "priceRange": "under_25|25_to_50|50_to_100|100_to_200|200_to_500|over_500|null",
  "brand": "brand_name_or_null",
  "intent": "brief description of what user wants"
}

EXAMPLES:
User: "I need something warm for winter"
Response: {"searchTerms": ["jacket", "coat", "sweater", "hoodie", "winter"], "category": "Clothing", "gender": null, "priceRange": null, "brand": null, "intent": "warm winter clothing"}

User: "cheap Nike shoes for running"
Response: {"searchTerms": ["Nike", "shoes", "running", "sneakers"], "category": "Shoes", "gender": null, "priceRange": "under_25", "brand": "Nike", "intent": "affordable Nike running shoes"}

User: "formal shirt for office men"
Response: {"searchTerms": ["formal", "shirt", "office", "dress shirt"], "category": "Clothing", "gender": "Male", "priceRange": null, "brand": null, "intent": "formal men's office shirt"}

User: "clothes for men"
Response: {"searchTerms": ["clothes", "clothing", "apparel", "men"], "category": "Clothing", "gender": "Male", "priceRange": null, "brand": null, "intent": "men's clothing"}

IMPORTANT: Return ONLY the JSON object, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using gpt-4o-mini as fallback
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      const aiResponse = response.choices[0].message.content.trim();
      logger.info(`AI Query Understanding - Input: "${userQuery}" -> Output: ${aiResponse}`);

      try {
        const parsedResponse = JSON.parse(aiResponse);
        return this.validateAndEnhanceResponse(parsedResponse, userQuery);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON:', parseError);
        return this.fallbackQueryProcessing(userQuery);
      }

    } catch (error) {
      logger.error('Error in AI query understanding:', error);
      return this.fallbackQueryProcessing(userQuery);
    }
  }

  /**
   * Validate and enhance the AI response
   */
  validateAndEnhanceResponse(aiResponse, originalQuery) {
    const enhanced = {
      searchTerms: Array.isArray(aiResponse.searchTerms) ? aiResponse.searchTerms : [originalQuery],
      category: aiResponse.category || null,
      gender: aiResponse.gender || null,
      priceRange: aiResponse.priceRange || null,
      brand: aiResponse.brand || null,
      intent: aiResponse.intent || 'product search',
      originalQuery: originalQuery,
      processedBy: 'ai'
    };

    // Ensure we have at least the original query as search term
    if (enhanced.searchTerms.length === 0) {
      enhanced.searchTerms = [originalQuery];
    }

    return enhanced;
  }

  /**
   * Fallback query processing when AI is not available
   */
  fallbackQueryProcessing(userQuery) {
    const query = userQuery.toLowerCase();
    
    // Basic keyword extraction
    const searchTerms = [userQuery];
    
    // Detect category
    let category = null;
    if (query.includes('shirt') || query.includes('jacket') || query.includes('pants') || 
        query.includes('jeans') || query.includes('clothes') || query.includes('clothing')) {
      category = 'Clothing';
    } else if (query.includes('shoes') || query.includes('sneakers') || query.includes('boots')) {
      category = 'Shoes';
    } else if (query.includes('phone') || query.includes('laptop') || query.includes('headphones')) {
      category = 'Electronics';
    }

    // Detect gender
    let gender = null;
    if (query.includes('men') || query.includes('male') || query.includes('man')) {
      gender = 'Male';
    } else if (query.includes('women') || query.includes('female') || query.includes('woman')) {
      gender = 'Female';
    }

    // Detect price intent
    let priceRange = null;
    if (query.includes('cheap') || query.includes('affordable') || query.includes('budget')) {
      priceRange = 'under_25';
    } else if (query.includes('expensive') || query.includes('premium') || query.includes('luxury')) {
      priceRange = 'over_500';
    }

    // Detect brand
    let brand = null;
    const brands = ['Nike', 'Adidas', 'Apple', 'Samsung', 'Sony', 'Puma', 'Levi\'s'];
    for (const b of brands) {
      if (query.includes(b.toLowerCase())) {
        brand = b;
        break;
      }
    }

    return {
      searchTerms,
      category,
      gender,
      priceRange,
      brand,
      intent: 'basic product search',
      originalQuery: userQuery,
      processedBy: 'fallback'
    };
  }

  /**
   * Build MeiliSearch query from understood query
   */
  buildMeiliSearchQuery(understoodQuery) {
    const { searchTerms, category, gender, priceRange, brand } = understoodQuery;
    
    // Create the main search query
    const mainQuery = searchTerms.join(' ');
    
    // Build filters
    const filters = [];
    
    if (category) {
      filters.push(`category = "${category}"`);
    }
    
    if (gender) {
      filters.push(`gender = "${gender}"`);
    }
    
    if (brand) {
      filters.push(`brand = "${brand}"`);
    }
    
    if (priceRange) {
      filters.push(`price_range = "${priceRange}"`);
    }

    return {
      query: mainQuery,
      filters: filters.join(' AND '),
      understoodQuery
    };
  }

  /**
   * Get search suggestions based on query understanding
   */
  getSearchSuggestions(understoodQuery) {
    const { intent, category, gender, brand } = understoodQuery;
    
    const suggestions = [];
    
    if (category && gender) {
      suggestions.push(`${gender.toLowerCase()} ${category.toLowerCase()}`);
    }
    
    if (brand && category) {
      suggestions.push(`${brand} ${category.toLowerCase()}`);
    }
    
    if (intent.includes('winter') || intent.includes('warm')) {
      suggestions.push('winter jacket', 'warm clothes', 'sweater');
    }
    
    if (intent.includes('formal') || intent.includes('office')) {
      suggestions.push('formal shirt', 'office wear', 'business attire');
    }
    
    if (intent.includes('sport') || intent.includes('athletic')) {
      suggestions.push('sports wear', 'athletic clothing', 'gym clothes');
    }

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }
}

module.exports = new QueryUnderstandingService();
