const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const FAQ = require('../../models/company-admin/faq-manager/FAQ');
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
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare FAQ context
    const faqContext = faqs.map((faq, index) => 
      `FAQ ${index + 1}:
Question: ${faq.question}
Answer: ${faq.answer}
Category: ${faq.category}`
    ).join('\n\n');

    const systemPrompt = `You are an intelligent customer support assistant with deep knowledge of the company's services and policies. Your role is to:

1. **Analyze Relevance**: Carefully evaluate if the user's question is related to the provided FAQ content
2. **Provide Direct Answers**: Give clear, direct responses without mentioning "FAQ" or "according to FAQ"
3. **Be Conversational**: Respond naturally as if you have direct knowledge of the company
4. **Acknowledge Limitations**: If the question is outside your scope, simply dont give any single information what he is asking just say i dont have information about it.

**Response Guidelines:**
- **Direct Answers**: Provide clear, helpful responses without referencing FAQ sources
- **Natural Language**: Speak as if you have direct knowledge of the company's services
- **Comprehensive**: Use both provided information and your knowledge to give complete answers
- **Professional**: Maintain a friendly, helpful tone
- **Redirect Gracefully**: If questions are unrelated, direct no and say contact support for the rest
- **Restrictive Information**: Do NOT provide any information about refunds, privacy policies, amounts, pricing, or any financial details unless explicitly mentioned in the provided FAQs
- **Conservative Approach**: Only provide information that is clearly stated in the FAQs - do not make assumptions or provide general knowledge

**Important**: Never say "According to FAQ" or "Based on FAQ" - give direct, confident answers as if you're a knowledgeable company representative.`;

         const userPrompt = `**User Question:** "${query}"

**Company Information Available:**
${faqContext}

**Your Task:**
1. Analyze if this question relates to the company's services or policies
2. Provide a direct, helpful answer using the available information and your knowledge
3. If the question is partially related, give what information you can and suggest additional help
4. If completely unrelated, politely redirect to relevant topics or contact methods simply dont give any single information what he is asking just say i dont have information about it.
5. Do NOT provide any information about refunds, privacy policies, amounts, pricing, or financial details unless explicitly mentioned in the FAQs

**Response Style:**
- Give direct, confident answers as a knowledgeable company representative
- Don't mention "FAQ" or "according to FAQ" - speak naturally
- Be helpful and conversational
- If you don't have specific information, say so clearly i dont have answer for this question and suggest alternatives
- Be conservative - only provide information that is clearly stated in the FAQs`;

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    return chatCompletion.choices[0].message.content.trim();
  } catch (error) {
    logger.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI response');
  }
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
    try {
      aiResponse = await generateAIResponse(query, relevantFAQs);
    } catch (aiError) {
      logger.error('AI response generation failed:', aiError);
      aiResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.";
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

    const finalSessionId = sessionId || generateSessionId(clientIP, companyId);

    const message = await ChatMessage.create({
      ipAddress: clientIP,
      companyId: parseInt(companyId),
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
