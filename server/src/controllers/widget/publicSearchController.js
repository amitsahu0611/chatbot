const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const FAQ = require('../../models/company-admin/faq-manager/FAQ');
const UnansweredQuery = require('../../models/company-admin/faq-manager/UnansweredQuery');
const ChatMessage = require('../../models/widget/ChatMessage');
const Lead = require('../../models/company-admin/lead-viewer/Lead');
const logger = require('../../utils/logger');

/**
 * Extract keywords from search query
 */
const extractKeywords = (query) => {
  if (!query || typeof query !== 'string') return [];
  
  // Convert to lowercase and remove special characters
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words and filter out common words and short words
  const words = cleanQuery.split(/\s+/).filter(word => 
    word.length >= 2 && 
    !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'how', 'why', 'when', 'where', 'who', 'which', 'that', 'this', 'these', 'those'].includes(word)
  );
  
  // Return unique words
  return [...new Set(words)];
};

/**
 * Enhanced search with better matching logic
 */
const searchFAQs = async (query, companyId, limit) => {
  const keywords = extractKeywords(query);
  console.log(`🔍 Extracted keywords: [${keywords.join(', ')}]`);
  
  let relevantFAQs = [];
  
  // First, let's check if there are any FAQs at all for this company
  const totalFAQs = await FAQ.count({
    where: {
      companyId: parseInt(companyId),
      isActive: true
    }
  });
  console.log(`📊 Total FAQs for company ${companyId}: ${totalFAQs}`);
  
  if (totalFAQs === 0) {
    console.log('❌ No FAQs found for this company');
    return [];
  }
  
  // Let's see what FAQs exist for this company
  const allCompanyFAQs = await FAQ.findAll({
    where: {
      companyId: parseInt(companyId),
      isActive: true
    },
    attributes: ['id', 'question', 'answer', 'category'],
    limit: 5
  });
  console.log('📋 Available FAQs for this company:');
  allCompanyFAQs.forEach((faq, index) => {
    console.log(`  ${index + 1}. ID: ${faq.id}, Question: "${faq.question}", Category: ${faq.category}`);
  });
  
  if (keywords.length > 0) {
    // Try exact keyword matching first
    const searchConditions = keywords.map(keyword => ({
      [Op.or]: [
        { question: { [Op.like]: `%${keyword}%` } },
        { answer: { [Op.like]: `%${keyword}%` } },
        { category: { [Op.like]: `%${keyword}%` } }
      ]
    }));

    console.log('🔧 Using exact keyword matching');
    console.log('🔍 Search conditions:', JSON.stringify(searchConditions, null, 2));
    
    relevantFAQs = await FAQ.findAll({
      where: {
        [Op.and]: [
          { companyId: parseInt(companyId) },
          { isActive: true },
          ...searchConditions
        ]
      },
      order: [
        ['views', 'DESC'],
        ['helpfulCount', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount', 'companyId']
    });
    
    console.log(`✅ Found ${relevantFAQs.length} FAQs with exact keywords`);
    
    // If we found results, show what we found
    if (relevantFAQs.length > 0) {
      console.log('📋 Found FAQs:');
      relevantFAQs.forEach((faq, index) => {
        console.log(`  ${index + 1}. Company: ${faq.companyId}, Question: "${faq.question}"`);
      });
    }
  }
  
  // If no exact matches, try broader search with individual words
  if (relevantFAQs.length === 0) {
    console.log('🔧 No exact matches, trying broader search');
    
    // Get all words from query (including common words)
    const allWords = query.toLowerCase().split(/\s+/).filter(word => word.length >= 2);
    console.log(`🔍 Trying broader search with words: [${allWords.join(', ')}]`);
    
    if (allWords.length > 0) {
      const broaderConditions = allWords.map(word => ({
        [Op.or]: [
          { question: { [Op.like]: `%${word}%` } },
          { answer: { [Op.like]: `%${word}%` } },
          { category: { [Op.like]: `%${word}%` } }
        ]
      }));

      relevantFAQs = await FAQ.findAll({
        where: {
          [Op.and]: [
            { companyId: parseInt(companyId) },
            { isActive: true },
            ...broaderConditions
          ]
        },
        order: [
          ['views', 'DESC'],
          ['helpfulCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit),
        attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount', 'companyId']
      });
      
      console.log(`✅ Found ${relevantFAQs.length} FAQs with broader search`);
    }
  }
  
  // If still no matches, try partial word matching (for cases like "account management" vs "Management System")
  if (relevantFAQs.length === 0) {
    console.log('🔧 No broader matches, trying partial word matching');
    
    // Get all words and try partial matches
    const allWords = query.toLowerCase().split(/\s+/).filter(word => word.length >= 3);
    console.log(`🔍 Trying partial matching with words: [${allWords.join(', ')}]`);
    
    if (allWords.length > 0) {
      // Create conditions that match partial words
      const partialConditions = allWords.map(word => ({
        [Op.or]: [
          { question: { [Op.like]: `%${word}%` } },
          { answer: { [Op.like]: `%${word}%` } },
          { category: { [Op.like]: `%${word}%` } }
        ]
      }));

      // Use OR instead of AND for partial matching
      relevantFAQs = await FAQ.findAll({
        where: {
          [Op.and]: [
            { companyId: parseInt(companyId) },
            { isActive: true },
            { [Op.or]: partialConditions }
          ]
        },
        order: [
          ['views', 'DESC'],
          ['helpfulCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit),
        attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount', 'companyId']
      });
      
      console.log(`✅ Found ${relevantFAQs.length} FAQs with partial matching`);
    }
  }
  
  return relevantFAQs;
};

/**
 * Generate AI response using OpenAI with intelligent FAQ matching
 */
const generateAIResponse = async (query, faqs) => {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    // Debug logging
    logger.info(`🔑 OpenAI API Key Status: ${OPENAI_API_KEY ? 'Present' : 'Missing'}`);
    if (OPENAI_API_KEY) {
      logger.info(`🔑 API Key Length: ${OPENAI_API_KEY.length}`);
      logger.info(`🔑 API Key Starts with: ${OPENAI_API_KEY.substring(0, 10)}...`);
    }
    
    // Check if OpenAI API key is configured
    if (!OPENAI_API_KEY || OPENAI_API_KEY === "your-openai-api-key-here" || OPENAI_API_KEY === "your-openai-api-key" || OPENAI_API_KEY.length < 20) {
      logger.info("⚠️ OpenAI API key not configured, using intelligent fallback response");
      return generateFallbackResponse(query, faqs);
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });

    // Prepare FAQ context
    const faqContext = faqs.map((faq, index) => 
      `FAQ ${index + 1}:
Question: ${faq.question}
Answer: ${faq.answer}
Category: ${faq.category}`
    ).join('\n\n');

    const systemPrompt = `
    You are a customer support assistant for this specific company. 
    
    CRITICAL RULES:
    1. ONLY answer based on the provided FAQ information - do not make up services or information
    2. If the user asks about services and there are no relevant FAQs, say "I don't have specific information about our services in my knowledge base"
    3. DO NOT assume what services the company offers unless explicitly mentioned in the FAQs
    4. Be honest about limitations - if you don't have the information, say so
    5. Only mention services that are actually described in the provided FAQs
    6. If asked about general questions not covered in FAQs, politely redirect to contact support
    
    Response Guidelines:
    - Answer only what you know from the FAQs provided
    - Don't invent or assume services not mentioned
    - Be specific and accurate to the company's actual offerings
    - If no relevant FAQ exists, admit you don't have that information
    `;
    

    const userPrompt = (query, faqs) => `
    User Question: "${query}"
    
    Company's FAQ Knowledge Base:
    ${faqs.length > 0 ? faqs.map((f,i)=>`Q${i+1}: ${f.question}\nA: ${f.answer}`).join("\n\n") : "No relevant FAQs found for this query."}
    
    Instructions:
    - If the question directly matches an FAQ, provide that information naturally
    - If asking about services and NO service-related FAQs exist, say "I don't have specific information about our services. Please contact our support team for detailed service information."
    - DO NOT make assumptions about what services might be offered
    - Only reference information that exists in the FAQs above
    - If no relevant FAQ exists, be honest and suggest contacting support
    - Be helpful but accurate - don't invent information
    `;
    


    const chatCompletion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt(query, faqs) }
      ],
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 800,
      temperature: 0.7,
    });

    return chatCompletion.choices[0].message.content.trim();
  } catch (error) {
    logger.error('OpenAI API error:', error);
    logger.info("🔄 Falling back to intelligent response system");
    return generateFallbackResponse(query, faqs);
  }
};

// Intelligent fallback response system
const generateFallbackResponse = (query, faqs) => {
  const queryLower = query.toLowerCase();
  
  // If we have relevant FAQs, use them to generate a response
  if (faqs.length > 0) {
    const bestMatch = faqs[0];
    return `Based on our information, here's what I found:\n\n**${bestMatch.question}**\n\n${bestMatch.answer}\n\nIf this doesn't fully answer your question, please let me know and I'll be happy to help further or connect you with our support team!`;
  }
  
  // Handle common questions with predefined responses
  if (queryLower.includes('service') || queryLower.includes('offer')) {
    return "I don't have specific information about our services in my current knowledge base. For detailed information about what services we offer, please contact our support team directly. They'll be happy to provide you with comprehensive details about our offerings!";
  }
  
  if (queryLower.includes('contact') || queryLower.includes('support') || queryLower.includes('help')) {
    return "I'm here to help! For immediate assistance, you can reach our support team through our contact form, email, or phone. Our team is available during business hours and will get back to you as soon as possible. Is there something specific I can help you with?";
  }
  
  if (queryLower.includes('price') || queryLower.includes('cost') || queryLower.includes('pricing')) {
    return "Our pricing varies depending on your specific needs and requirements. To get accurate pricing information, I'd recommend contacting our sales team directly. They can provide you with a customized quote based on your situation. Would you like me to help you get in touch with them?";
  }
  
  if (queryLower.includes('hour') || queryLower.includes('time') || queryLower.includes('when')) {
    return "Our business hours are typically Monday through Friday, 9 AM to 6 PM. However, specific hours may vary by department. For the most accurate information, please check our website or contact us directly. We're here to help whenever you need us!";
  }
  
  // Default response
  return "Thank you for your question! I'm here to help, but I might need to connect you with our support team for the most accurate and up-to-date information. They'll be happy to assist you with any specific questions you have. Is there anything else I can help you with?";
};

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         '127.0.0.1';
};

/**
 * Generate session ID
 */
const generateSessionId = (ipAddress, companyId) => {
  const timestamp = Date.now();
  return `${ipAddress}_${companyId}_${timestamp}`;
};

/**
 * Store unanswered query for admin review
 */
const storeUnansweredQuery = async (query, companyId, ipAddress, userAgent, sessionId) => {
  try {
    logger.info(`📝 Storing unanswered query for company ${companyId}: "${query}"`);
    
    const unansweredQuery = await UnansweredQuery.findOrCreateQuery({
      companyId: parseInt(companyId),
      query: query.trim(),
      ipAddress: ipAddress,
      userAgent: userAgent,
      sessionId: sessionId
    });
    
    logger.info(`✅ Unanswered query stored with ID: ${unansweredQuery.id}, frequency: ${unansweredQuery.frequency}`);
    return unansweredQuery;
  } catch (error) {
    logger.error('Error storing unanswered query:', error);
    // Don't fail the request if storage fails
    return null;
  }
};

/**
 * Check if response indicates lack of knowledge
 */
const isLowQualityResponse = (response, faqs) => {
  const lowerResponse = response.toLowerCase();
  
  // If no FAQs were found, consider it low quality
  if (faqs.length === 0) return true;
  
  // Check for common "I don't know" phrases
  const unknownPhrases = [
    "don't have specific information",
    "don't have information",
    "contact our support",
    "contact support",
    "i don't have",
    "not in my knowledge",
    "please contact",
    "i'm not sure",
    "i don't know"
  ];
  
  return unknownPhrases.some(phrase => lowerResponse.includes(phrase));
};

/**
 * Public AI search endpoint (no authentication required)
 */
const publicAiSearch = async (req, res) => {
  try {
    const { query, limit = 5, companyId } = req.query;
    const clientIP = getClientIP(req);

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`🤖 Public AI search for query: "${query}", IP: ${clientIP}, company: ${companyId}`);

    // Generate session ID
    const sessionId = generateSessionId(clientIP, companyId);

    // Store user message
    try {
      await ChatMessage.create({
        ipAddress: clientIP,
        companyId: parseInt(companyId),
        sessionId: sessionId,
        messageType: 'user',
        content: query.trim(),
        timestamp: new Date(),
        metadata: {
          userAgent: req.headers['user-agent'],
          referer: req.headers.referer
        }
      });
    } catch (storageError) {
      logger.error('Error storing user message:', storageError);
      // Don't fail the request if storage fails
    }

    // Get FAQs for AI analysis using enhanced search
    let relevantFAQs = [];
    
    try {
      // Use enhanced search function
      relevantFAQs = await searchFAQs(query, companyId, limit);
      
      console.log(`📚 Sending ${relevantFAQs.length} FAQs to AI for intelligent analysis for company ${companyId}`);
      
      // Log the FAQs being sent to verify they're company-specific
      if (relevantFAQs.length > 0) {
        console.log('📋 FAQs being sent to AI:');
        relevantFAQs.forEach((faq, index) => {
          console.log(`  ${index + 1}. ID: ${faq.id}, Company: ${faq.companyId}, Question: "${faq.question}"`);
        });
      }
    } catch (searchError) {
      logger.error('Error searching FAQs:', searchError);
      // Continue with empty FAQs array - AI will handle it
    }

    // Generate AI response
    let aiResponse;
    let isUnanswered = false;
    try {
      aiResponse = await generateAIResponse(query, relevantFAQs);
      
      // Check if the response indicates lack of knowledge
      if (isLowQualityResponse(aiResponse, relevantFAQs)) {
        isUnanswered = true;
        logger.info(`🔍 Low quality response detected for query: "${query}"`);
      }
    } catch (aiError) {
      logger.error('AI response generation failed:', aiError);
      aiResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
      isUnanswered = true;
    }

    // Store unanswered query if response is inadequate
    if (isUnanswered) {
      await storeUnansweredQuery(
        query,
        companyId,
        clientIP,
        req.headers['user-agent'],
        sessionId
      );
    }

    // Store bot message
    try {
      await ChatMessage.create({
        ipAddress: clientIP,
        companyId: parseInt(companyId),
        sessionId: sessionId,
        messageType: 'bot',
        content: aiResponse,
        timestamp: new Date(),
        metadata: {
          source: relevantFAQs.length > 0 ? 'ai' : 'fallback',
          confidence: relevantFAQs.length > 0 ? 0.8 : 0.3,
          relatedFAQs: relevantFAQs.map(faq => ({
            id: faq.id,
            question: faq.question,
            category: faq.category
          }))
        }
      });
    } catch (storageError) {
      logger.error('Error storing bot message:', storageError);
      // Don't fail the request if storage fails
    }

    // Return response
    res.json({
      success: true,
      data: {
        answer: aiResponse,
        source: relevantFAQs.length > 0 ? 'ai' : 'fallback',
        confidence: relevantFAQs.length > 0 ? 0.8 : 0.3,
        relatedFAQs: relevantFAQs.map(faq => ({
          id: faq.id,
          question: faq.question,
          category: faq.category,
          views: faq.views,
          helpfulCount: faq.helpfulCount
        }))
      }
    });

  } catch (error) {
    logger.error('Public AI search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

/**
 * Get chat history for an IP address with pagination
 */
const getChatHistory = async (req, res) => {
  try {
    const { companyId, page = 1, limit = 20 } = req.query;
    const clientIP = getClientIP(req);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.info(`📜 Getting chat history for IP ${clientIP}, company ${companyId}, page ${page}`);

    // Get messages for this IP and company with pagination
    const { count, rows: messages } = await ChatMessage.findAndCountAll({
      where: {
        ipAddress: clientIP,
        companyId: parseInt(companyId)
      },
      order: [['timestamp', 'DESC']], // Most recent first
      limit: parseInt(limit),
      offset: offset,
      attributes: ['id', 'messageType', 'content', 'timestamp', 'sessionId', 'metadata']
    });

    // Get the most recent session ID
    const latestSession = await ChatMessage.findOne({
      where: {
        ipAddress: clientIP,
        companyId: parseInt(companyId)
      },
      order: [['timestamp', 'DESC']],
      attributes: ['sessionId']
    });

    // Group messages by session and reverse order for chronological display
    const sessions = {};
    messages.reverse().forEach(message => {
      if (!sessions[message.sessionId]) {
        sessions[message.sessionId] = [];
      }
      sessions[message.sessionId].push({
        id: message.id,
        type: message.messageType,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata
      });
    });

    // Flatten all messages in chronological order
    const allMessages = Object.values(sessions).flat();

    res.json({
      success: true,
      data: {
        messages: allMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalMessages: count,
          hasMore: offset + messages.length < count
        },
        currentSessionId: latestSession?.sessionId || null
      }
    });

  } catch (error) {
    logger.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat history'
    });
  }
};

/**
 * Store individual message (for FAQ answers)
 */
const storeMessage = async (req, res) => {
  try {
    const { messageType, content, companyId, sessionId } = req.body;
    const clientIP = getClientIP(req);

    if (!messageType || !content || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Message type, content, and company ID are required'
      });
    }

    // Validate company ID is a valid number
    const parsedCompanyId = parseInt(companyId);
    if (isNaN(parsedCompanyId) || parsedCompanyId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company ID provided'
      });
    }

    const finalSessionId = sessionId || generateSessionId(clientIP, parsedCompanyId);

    const message = await ChatMessage.create({
      ipAddress: clientIP,
      companyId: parsedCompanyId,
      sessionId: finalSessionId,
      messageType: messageType,
      content: content,
      timestamp: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        referer: req.headers.referer
      }
    });

    res.json({
      success: true,
      data: {
        id: message.id,
        sessionId: finalSessionId
      }
    });

  } catch (error) {
    logger.error('Store message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error storing message'
    });
  }
};

/**
 * Get public search suggestions based on FAQs (no authentication required)
 */
const getPublicSearchSuggestions = async (req, res) => {
  try {
    const { query, limit = 5, companyId } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`🔍 Getting intelligent search suggestions for query: "${query}", company: ${companyId}`);

    // Use enhanced search for suggestions
    let faqs = await searchFAQs(query, companyId, limit);

    // If no matches, get some popular FAQs as suggestions for this specific company
    if (faqs.length === 0) {
      logger.info('No matches found, getting popular FAQs as suggestions for this company');
      faqs = await FAQ.findAll({
        where: {
          companyId: parseInt(companyId),
          isActive: true
        },
        order: [
          ['views', 'DESC'],
          ['helpfulCount', 'DESC'],
          ['createdAt', 'DESC']
        ],
        limit: parseInt(limit),
        attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount', 'companyId']
      });
    }

    logger.info(`✅ Found ${faqs.length} FAQ suggestions`);

    res.json({
      success: true,
      data: faqs.map(faq => ({
        id: faq.id,
        question: faq.question,
        category: faq.category,
        views: faq.views,
        helpfulCount: faq.helpfulCount
      }))
    });

  } catch (error) {
    logger.error('Public search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting search suggestions'
    });
  }
};

/**
 * Get specific FAQ answer (no authentication required)
 */
const getPublicFaqAnswer = async (req, res) => {
  try {
    const { faqId, companyId } = req.query;

    if (!faqId) {
      return res.status(400).json({
        success: false,
        message: 'FAQ ID is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`📖 Getting FAQ answer for ID: ${faqId}, company: ${companyId}`);

    // Find the specific FAQ
    const faq = await FAQ.findOne({
      where: {
        id: parseInt(faqId),
        companyId: parseInt(companyId),
        isActive: true
      },
      attributes: ['id', 'question', 'answer', 'category', 'views', 'helpfulCount']
    });

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Increment view count
    await faq.increment('views');

    logger.info(`✅ Found FAQ answer for ID: ${faqId}`);

    res.json({
      success: true,
      data: {
        answer: faq.answer,
        question: faq.question,
        category: faq.category,
        views: faq.views + 1, // +1 because we just incremented
        helpfulCount: faq.helpfulCount
      }
    });

  } catch (error) {
    logger.error('Get public FAQ answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting FAQ answer'
    });
  }
};

/**
 * Create lead from any form submission (no authentication required)
 */
const createPublicLead = async (req, res) => {
  try {
    const { name, email, topic, companyId, formData, formType = 'custom', source = 'Website Form' } = req.body;
    const clientIP = getClientIP(req);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    logger.info(`📝 Creating public lead for company ${companyId}, email: ${email}, source: ${source}`);

    // Generate visitor ID from IP and timestamp
    const visitorId = `${clientIP}_${Date.now()}`;

    // Create lead
    const lead = await Lead.create({
      companyId: parseInt(companyId),
      visitorId: visitorId,
      name: name.trim(),
      email: email.trim(),
      source: source,
      status: 'new',
      priority: 'medium',
      ipAddress: clientIP,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer,
      firstVisit: new Date(),
      lastVisit: new Date(),
      hasChatted: source === 'Chatbot Welcome Form',
      chatCount: source === 'Chatbot Welcome Form' ? 1 : 0,
      lastChatAt: source === 'Chatbot Welcome Form' ? new Date() : null,
      notes: topic ? `Interested in: ${topic}` : `Contact via ${source}`,
      customFields: {
        topic: topic || '',
        formType: formType,
        formData: formData || {},
        chatbotSession: source === 'Chatbot Welcome Form'
      },
      metadata: {
        source: source.toLowerCase().replace(/\s+/g, '_'),
        topic: topic,
        formType: formType,
        userAgent: req.headers['user-agent'],
        referrer: req.headers.referer
      }
    });

    logger.info(`✅ Lead created successfully with ID: ${lead.id}`);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        id: lead.id,
        visitorId: lead.visitorId
      }
    });

  } catch (error) {
    logger.error('Error creating public lead:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lead'
    });
  }
};

module.exports = {
  publicAiSearch,
  getChatHistory,
  getPublicSearchSuggestions,
  getPublicFaqAnswer,
  storeMessage,
  createPublicLead
};
