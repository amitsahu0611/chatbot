const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const FAQ = require('../../models/company-admin/faq-manager/FAQ');
const SupportSettings = require('../../models/company-admin/support-settings/SupportSettings');
const logger = require('../../utils/logger');

/**
 * AI-powered search endpoint
 * Uses keyword matching to find relevant FAQs and sends them to AI for response generation
 */
const aiSearch = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to use the AI search.'
      });
    }

    const { companyId } = req.user;
    const { query, limit = 5 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    logger.info(`🔍 AI Search request for company ${companyId}: "${query}"`);
    logger.info(`🔍 User company ID: ${companyId}, User ID: ${req.user.userId || 'N/A'}`);

    // Check database connection
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      logger.error('Database connection failed:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error. Please try again later.'
      });
    }

    // Check if there are any FAQs in the database for this company
    try {
      const totalFAQs = await FAQ.count({
        where: { companyId, isActive: true }
      });
      logger.info(`Total active FAQs for company ${companyId}: ${totalFAQs}`);
      
      if (totalFAQs === 0) {
        logger.warn(`No FAQs found for company ${companyId}`);
      }
    } catch (countError) {
      logger.error('Error counting FAQs:', countError);
    }

    // Get AI settings from support settings
    let supportSettings;
    try {
      supportSettings = await SupportSettings.findOne({ 
        where: { companyId },
        attributes: ['chatSettings', 'autoResponse']
      });
    } catch (settingsError) {
      logger.error('Error fetching support settings:', settingsError);
      supportSettings = null;
    }

    // Use default settings if none found
    const chatSettings = supportSettings?.chatSettings || { enableChatbot: true };
    const isAIChatbotEnabled = chatSettings?.enableChatbot !== false;

    if (!isAIChatbotEnabled) {
      return res.status(400).json({
        success: false,
        message: 'AI chatbot is not enabled for this company. Please contact your administrator.'
      });
    }

    // Extract keywords from query
    const keywords = extractKeywords(query);
    logger.info(`Extracted keywords: ${keywords.join(', ')}`);

    // Search for relevant FAQs based on keywords
    let relevantFAQs = [];
    
    try {
      // First try with keywords
      if (keywords.length > 0) {
        // Build search conditions for each keyword
        const searchConditions = keywords.map(keyword => ({
          [Op.or]: [
            { question: { [Op.like]: `%${keyword}%` } },
            { answer: { [Op.like]: `%${keyword}%` } }
          ]
        }));

        // Find FAQs that match any of the keywords
        relevantFAQs = await FAQ.findAll({
          where: {
            companyId,
            isActive: true,
            [Op.or]: searchConditions
          },
          attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount'],
          order: [
            ['helpfulCount', 'DESC'],
            ['views', 'DESC']
          ],
          limit: parseInt(limit)
        });

        logger.info(`Found ${relevantFAQs.length} FAQs matching keywords: ${keywords.join(', ')}`);
      }
      
      // If no results with keywords, try a broader search with the original query
      if (relevantFAQs.length === 0) {
        logger.info('No results with keywords, trying broader search...');
        
        const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length >= 2);
        
        if (queryWords.length > 0) {
          const broaderSearchConditions = queryWords.map(word => ({
            [Op.or]: [
              { question: { [Op.like]: `%${word}%` } },
              { answer: { [Op.like]: `%${word}%` } }
            ]
          }));

          relevantFAQs = await FAQ.findAll({
            where: {
              companyId,
              isActive: true,
              [Op.or]: broaderSearchConditions
            },
            attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount'],
            order: [
              ['helpfulCount', 'DESC'],
              ['views', 'DESC']
            ],
            limit: parseInt(limit)
          });

          logger.info(`Found ${relevantFAQs.length} FAQs with broader search using words: ${queryWords.join(', ')}`);
        }
      }
      
      // If still no results, get some general FAQs
      if (relevantFAQs.length === 0) {
        logger.info('No results with broader search, getting general FAQs...');
        
        relevantFAQs = await FAQ.findAll({
          where: {
            companyId,
            isActive: true
          },
          attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount'],
          order: [
            ['helpfulCount', 'DESC'],
            ['views', 'DESC']
          ],
          limit: parseInt(limit)
        });

        logger.info(`Found ${relevantFAQs.length} general FAQs for company ${companyId}`);
        
        // If still no results, try searching across all companies (fallback)
        if (relevantFAQs.length === 0) {
          logger.info('No FAQs found for specific company, trying fallback search across all companies...');
          
          relevantFAQs = await FAQ.findAll({
            where: {
              isActive: true
            },
            attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount'],
            order: [
              ['helpfulCount', 'DESC'],
              ['views', 'DESC']
            ],
            limit: parseInt(limit)
          });

          logger.info(`Found ${relevantFAQs.length} general FAQs across all companies (fallback)`);
        }
      }
    } catch (searchError) {
      logger.error('Error searching FAQs:', searchError);
      relevantFAQs = [];
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(query, relevantFAQs, keywords);

    // Debug logging
    logger.info(`🔍 SEARCH DEBUG INFO:`);
    logger.info(`- Original Query: "${query}"`);
    logger.info(`- Extracted Keywords: [${keywords.join(', ')}]`);
    logger.info(`- Found FAQs: ${relevantFAQs.length}`);
    if (relevantFAQs.length > 0) {
      logger.info(`- FAQ Questions: ${relevantFAQs.map(f => f.question.substring(0, 50) + '...').join(', ')}`);
    }
    logger.info(`- AI Response Source: ${aiResponse.source}`);
    logger.info(`- AI Response Confidence: ${aiResponse.confidence}`);

    // Prepare final response
    const finalResponse = {
      success: true,
      data: {
        answer: aiResponse.answer,
        source: aiResponse.source,
        confidence: aiResponse.confidence,
        relatedFAQs: relevantFAQs.map(faq => ({
          id: faq.id,
          question: faq.question,
          category: faq.category,
          views: faq.views,
          helpfulCount: faq.helpfulCount
        }))
      }
    };

    logger.info("📤 FINAL RESPONSE TO CLIENT:");
    logger.info(JSON.stringify(finalResponse, null, 2));

    res.json(finalResponse);

  } catch (error) {
    logger.error('Error in AI search:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while processing your request. Please try again.'
    });
  }
};

/**
 * Extract keywords from query
 */
const extractKeywords = (query) => {
  // Remove common stop words and special characters
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 
    'what', 'when', 'where', 'why', 'how', 'can', 'could', 'would', 'should', 'will', 'i', 'you', 'we', 'they', 'me', 'my', 
    'your', 'our', 'their', 'this', 'that', 'these', 'those', 'please', 'thank', 'thanks', 'hello', 'hi', 'hey'
  ]);
  
  // More flexible keyword extraction - include words with 2+ characters
  const keywords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length >= 2 && !stopWords.has(word));
  
  // If no keywords found, use the original query words (excluding stop words)
  if (keywords.length === 0) {
    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length >= 2 && !stopWords.has(word));
  }
  
  return keywords;
};

/**
 * Generate AI response using OpenAI API with FAQ-based rules
 */
const generateAIResponse = async (userQuery, relevantFAQs, keywords) => {
  // If no relevant FAQs found, return a helpful message
  if (relevantFAQs.length === 0) {
    return {
      answer: `I don't have enough information about "${userQuery}" in our knowledge base. Please contact our support team for assistance with this specific question.`,
      source: 'fallback',
      confidence: 0
    };
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-openai-api-key") {
      logger.info("⚠️ OpenAI API key not configured, using fallback response");
      return generateFallbackResponse(userQuery, relevantFAQs);
    }

    // FAQ-Based AI Assistant Prompt
    const systemPrompt = `
    You are a customer support assistant for Blinkit, a fast grocery delivery service.
    
    CRITICAL RULES:
    1. Always use the provided FAQ content as the only source of truth.
    2. If the FAQ question matches exactly, rephrase the FAQ answer slightly (do not copy word for word).
    3. If the FAQ is related but not exact, give a short 2-line helpful answer using what you know, then suggest contacting support.
    4. If there is no relevant FAQ, say politely you don’t have enough info and suggest contacting support.
    5. Keep responses very short, clear, and under 80 words.
    6. Always end the message with: "For more details, you can contact our customer care team at support@company.com or call 1-800-123-4567."
    7. Never invent features or information not present in the FAQs.
    
    HOW TO RESPOND:
    - Exact match → concise, slightly rephrased FAQ answer
    - Related match → 2-liner helpful answer + support contact
    - No match → “I don’t have enough info” + support contact
    - If the user question is relevant to the faq questions evaluation and related then answer it by yourself othersiwe i it's not relevant then say contacting support for the rest
    - Try to be helpful even with partial information from the FAQs
    `;
    
    

    // Prepare FAQ context for the prompt
    const faqContext = relevantFAQs.map((faq, index) => 
      `FAQ ${index + 1}:
Question: ${faq.question}
Answer: ${faq.answer}
Category: ${faq.category}`
    ).join('\n\n');

    const userPrompt = `User Question: "${userQuery}"

Relevant FAQs from our knowledge base:
${faqContext}

Please provide a helpful answer based on the above FAQ content. If the FAQs contain relevant information, use it to answer the question. If the FAQs don't contain the specific answer but have related information, provide what you can and suggest contacting support for more details. 

IMPORTANT: If you find any relevant information in the FAQs, use it to provide a helpful response. Only say "I don't have enough information" if there's truly no relevant content in the FAQs at all.`;

    const requestBody = {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
      temperature: 0.3, // Lower temperature for more deterministic responses
      stream: false,
    };

    logger.info("🚀 Making request to OpenAI API...");
    logger.info(`FAQ Context Count: ${relevantFAQs.length}`);

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
      return generateFallbackResponse(userQuery, relevantFAQs);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message) {
      logger.error("❌ Invalid response from OpenAI API:", data);
      return generateFallbackResponse(userQuery, relevantFAQs);
    }

    const aiAnswer = data.choices[0].message.content.trim();
    const confidence = calculateConfidence(userQuery, relevantFAQs, keywords);

    logger.info("✅ Successfully generated AI response");
    logger.info(`📊 Confidence Score: ${confidence}`);

    return {
      answer: aiAnswer,
      source: 'ai',
      confidence,
    };
  } catch (error) {
    logger.error("❌ Error generating AI response with OpenAI:", error);
    return generateFallbackResponse(userQuery, relevantFAQs);
  }
};

/**
 * Generate fallback response when AI is not available
 */
const generateFallbackResponse = (userQuery, relevantFAQs) => {
  if (relevantFAQs.length === 0) {
    return {
      answer: `I don't have enough information about "${userQuery}" in our knowledge base. Please contact our support team for assistance with this specific question.`,
      source: 'fallback',
      confidence: 0
    };
  }

  // If we have FAQs but couldn't generate AI response, provide the most relevant FAQ
  const mostRelevantFAQ = relevantFAQs[0];
  return {
    answer: `Based on our knowledge base, here's information that might be helpful:\n\n**${mostRelevantFAQ.question}**\n${mostRelevantFAQ.answer}\n\nFor more specific information about "${userQuery}", please contact our support team.`,
    source: 'fallback',
    confidence: 0.5
  };
};

/**
 * Calculate confidence score based on query relevance to FAQs
 */
const calculateConfidence = (userQuery, faqContext, keywords) => {
  if (faqContext.length === 0) return 0;

  const queryWords = userQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  let totalScore = 0;

  faqContext.forEach(faq => {
    const faqText = `${faq.question} ${faq.answer}`.toLowerCase();
    let score = 0;

    // Check how many keywords match
    keywords.forEach(keyword => {
      if (faqText.includes(keyword)) {
        score += 1;
      }
    });

    totalScore += score / keywords.length;
  });

  return Math.min(totalScore / faqContext.length, 1);
};

/**
 * Get search suggestions based on popular FAQs
 */
const getSearchSuggestions = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.companyId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { companyId } = req.user;
    const { query, limit = 5 } = req.query;

    logger.info(`Search suggestions request for company ${companyId}: "${query}"`);

    // Check database connection
    try {
      await sequelize.authenticate();
    } catch (dbError) {
      logger.error('Database connection failed for suggestions:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database connection error'
      });
    }

    let whereClause = {
      companyId,
      isActive: true
    };

    if (query && query.trim().length > 0) {
      const keywords = extractKeywords(query);
      
      if (keywords.length > 0) {
        // Build search conditions for each keyword
        const searchConditions = keywords.map(keyword => ({
          [Op.or]: [
            { question: { [Op.like]: `%${keyword}%` } },
            { answer: { [Op.like]: `%${keyword}%` } }
          ]
        }));

        whereClause = {
          ...whereClause,
          [Op.or]: searchConditions
        };
      }
    }

    let suggestions = [];
    try {
      suggestions = await FAQ.findAll({
        where: whereClause,
        attributes: ['id', 'question', 'category', 'views', 'helpfulCount'],
        order: [
          ['helpfulCount', 'DESC'],
          ['views', 'DESC']
        ],
        limit: parseInt(limit)
      });
    } catch (searchError) {
      logger.error('Error fetching search suggestions:', searchError);
      suggestions = [];
    }

    logger.info(`Found ${suggestions.length} suggestions for query: "${query}"`);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    logger.error('Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get search suggestions'
    });
  }
};

module.exports = {
  aiSearch,
  getSearchSuggestions
};