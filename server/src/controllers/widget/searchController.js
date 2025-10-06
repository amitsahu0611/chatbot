const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const FAQ = require('../../models/company-admin/faq-manager/FAQ');
const SupportSettings = require('../../models/company-admin/support-settings/SupportSettings');
const Company = require('../../models/Company');
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

    // Get ALL company FAQs and support information for complete knowledge analysis
    let allCompanyFAQs = [];
    let companyInfo = null;
    let companySupportInfo = null;
    
    try {
      // Fetch ALL active FAQs for this company (complete knowledge base)
      allCompanyFAQs = await FAQ.findAll({
        where: {
          companyId,
          isActive: true
        },
        attributes: ['id', 'question', 'answer', 'category', 'tags', 'views', 'helpfulCount'],
        order: [
          ['helpfulCount', 'DESC'],
          ['views', 'DESC'],
          ['createdAt', 'DESC']
        ]
      });

      logger.info(`📚 Fetched ALL ${allCompanyFAQs.length} FAQs for complete knowledge analysis for company ${companyId}`);
      logger.info(`🔍 User Query: "${query}"`);
      
    } catch (searchError) {
      logger.error('Error fetching all company FAQs:', searchError);
      allCompanyFAQs = [];
    }

    // Fetch company information and support settings for fallback contact info
    try {
      const Company = require('../../models/Company');
      const SupportSettings = require('../../models/company-admin/support-settings/SupportSettings');
      
      // Get company basic info
      companyInfo = await Company.findOne({
        where: { id: companyId },
        attributes: ['id', 'name', 'email', 'phone', 'domain']
      });
      
      // Get support settings for additional contact info
      companySupportInfo = await SupportSettings.findOne({
        where: { companyId },
        attributes: ['widgetSettings', 'autoResponse', 'customization']
      });
      
      logger.info(`📞 Fetched support information for company: ${companyInfo?.name || 'Unknown'}`);
      
    } catch (infoError) {
      logger.error('Error fetching company support information:', infoError);
      // Continue without support info - AI will use generic fallback
    }

    // Generate AI response
    const aiResponse = await generateAIResponse(query, allCompanyFAQs, keywords, companyId, companyInfo, companySupportInfo);

    // Debug logging
    logger.info(`🔍 SEARCH DEBUG INFO:`);
    logger.info(`- Original Query: "${query}"`);
    logger.info(`- Extracted Keywords: [${keywords.join(', ')}]`);
    logger.info(`- Total Company FAQs Processed: ${allCompanyFAQs.length}`);
    if (allCompanyFAQs.length > 0) {
      logger.info(`- Sample FAQ Questions: ${allCompanyFAQs.slice(0, 3).map(f => f.question.substring(0, 50) + '...').join(', ')}`);
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
        totalFAQsProcessed: allCompanyFAQs.length,
        topFAQs: allCompanyFAQs.slice(0, 5).map(faq => ({
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
 * Generate enhanced fallback response with company-specific suggestions
 */
const generateEnhancedFallbackResponse = async (query, companyId, searchTerm = null) => {
  try {
    // Get company information
    const company = await Company.findByPk(companyId, {
      attributes: ['name', 'domain', 'email']
    });

    const companyName = company ? company.name : 'our company';
    const searchTermText = searchTerm || query;

    // Create enhanced fallback message
    const fallbackMessage = `I don't have specific information about "${searchTermText}." Please contact our support team for detailed information.\n\nHowever, I can help you with questions about ${companyName} and services related to our company. Feel free to ask me about:\n• Our services and offerings\n• Business hours\n• Contact information\n• General company information`;

    return {
      answer: fallbackMessage,
      source: 'enhanced_fallback',
      confidence: 0.2
    };
  } catch (error) {
    logger.error('Error generating enhanced fallback response:', error);
    // Return basic fallback if company lookup fails
    const searchTermText = searchTerm || query;
    return {
      answer: `I don't have specific information about "${searchTermText}." Please contact our support team for detailed information.`,
      source: 'fallback',
      confidence: 0
    };
  }
};

/**
 * Generate AI response using OpenAI API with FAQ-based rules
 */
const generateAIResponse = async (userQuery, allCompanyFAQs, keywords, companyId = null, companyInfo = null, companySupportInfo = null) => {
  // If no company FAQs found, return enhanced fallback message
  if (allCompanyFAQs.length === 0) {
    if (companyId) {
      return await generateEnhancedFallbackResponse(userQuery, companyId);
    }
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
      return await generateFallbackResponse(userQuery, allCompanyFAQs, companyId);
    }

    // FAQ-Based AI Assistant Prompt
    const systemPrompt = `
    You are a customer support assistant with access to the COMPLETE FAQ knowledge base for this company.
    
    CRITICAL RULES:
    1. You have access to ALL company FAQs - analyze them thoroughly to find the best answer
    2. Process the ENTIRE knowledge base to provide the most accurate response
    3. LIMIT your response to MAXIMUM 50 words - be concise and direct
    4. If multiple FAQs are relevant, synthesize the best answer from them
    5. Only answer based on the provided FAQ information - never make up information
    6. If no FAQ covers the question, say you don't have that information and suggest contacting support
    
    Response Guidelines:
    - Maximum 50 words only
    - Search through ALL provided FAQs for the best answer
    - Be precise and helpful
    - If no relevant information exists in any FAQ, be honest about it
    `;
    
    

    // Prepare complete FAQ context for the prompt
    const faqContext = allCompanyFAQs.map((faq, index) => 
      `FAQ-${index + 1}:
Q: ${faq.question}
A: ${faq.answer}
Category: ${faq.category || 'General'}`
    ).join('\n\n');

    // Prepare support information context
    const supportInfo = companyInfo ? {
      companyName: companyInfo.name,
      email: companyInfo.email,
      phone: companyInfo.phone,
      website: companyInfo.domain,
      welcomeMessage: companySupportInfo?.widgetSettings?.welcomeMessage,
      offlineMessage: companySupportInfo?.autoResponse?.offlineMessage,
      brandName: companySupportInfo?.customization?.brandName || companyInfo.name
    } : null;

    const userPrompt = `
    User Question: "${userQuery}"
    
    COMPLETE Company FAQ Knowledge Base (${allCompanyFAQs.length} FAQs):
    ${faqContext}
    
    ${supportInfo ? `
    COMPANY SUPPORT INFORMATION:
    Company Name: ${supportInfo.companyName}
    Email: ${supportInfo.email}
    Phone: ${supportInfo.phone || 'Not provided'}
    Website: ${supportInfo.website || 'Not provided'}
    Brand Name: ${supportInfo.brandName}
    Welcome Message: ${supportInfo.welcomeMessage || 'Hello! How can I help you today?'}
    ` : ''}
    
    Instructions:
    - Analyze ALL ${allCompanyFAQs.length} FAQs above to find the best answer
    - Process the complete knowledge base thoroughly
    - MAXIMUM 50 words in your response
    - If multiple FAQs relate to the question, combine insights for the best answer
    - If no FAQ covers the question, provide the company's support contact information
    - Include contact details (email/phone) when no specific answer is found
    - Be concise, accurate, and helpful
    `;
    

    const requestBody = {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 75, // Strict limit for ~50 words
      temperature: 0.3, // Lower temperature for more focused responses
      stream: false,
    };

    logger.info("🚀 Making request to OpenAI API...");
    logger.info(`Complete FAQ Knowledge Base Count: ${allCompanyFAQs.length}`);

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
      return await generateFallbackResponse(userQuery, allCompanyFAQs, companyId);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message) {
      logger.error("❌ Invalid response from OpenAI API:", data);
      return await generateFallbackResponse(userQuery, allCompanyFAQs, companyId);
    }

    const aiAnswer = data.choices[0].message.content.trim();
    const confidence = calculateConfidence(userQuery, allCompanyFAQs, keywords);

    logger.info("✅ Successfully generated AI response");
    logger.info(`📊 Confidence Score: ${confidence}`);

    return {
      answer: aiAnswer,
      source: 'ai',
      confidence,
    };
  } catch (error) {
    logger.error("❌ Error generating AI response with OpenAI:", error);
    return await generateFallbackResponse(userQuery, relevantFAQs, companyId);
  }
};

/**
 * Generate fallback response when AI is not available
 */
const generateFallbackResponse = async (userQuery, relevantFAQs, companyId = null) => {
  if (relevantFAQs.length === 0) {
    if (companyId) {
      return await generateEnhancedFallbackResponse(userQuery, companyId);
    }
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