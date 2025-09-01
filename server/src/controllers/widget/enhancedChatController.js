const { Op } = require('sequelize');
const ChatMessage = require('../../models/widget/ChatMessage');
const FAQ = require('../../models/company-admin/faq-manager/FAQ');
const VisitorSession = require('../../models/widget/VisitorSession');
const Lead = require('../../models/company-admin/lead-viewer/Lead');
const logger = require('../../utils/logger');

/**
 * Enhanced chat message handler with new features
 */
const sendEnhancedMessage = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { 
      message, 
      companyId, 
      sessionId, 
      messageType = 'text',
      attachments = [],
      quickReply = false,
      sessionToken 
    } = req.body;

    if (!message || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Message and company ID are required'
      });
    }

    // Get user IP for session tracking
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    // First, search for relevant FAQs
    const faqResults = await searchRelevantFAQs(message, companyId);
    
    // Generate AI response based on context
    const aiResponse = await generateEnhancedResponse(message, faqResults, companyId);

    // Store the user message
    let userMessageId = null;
    if (sessionId) {
      try {
        const userMessage = await ChatMessage.create({
          sessionId,
          messageType: 'user',
          content: message,
          companyId: parseInt(companyId),
          ipAddress,
          metadata: {
            attachments,
            quickReply,
            timestamp: new Date().toISOString()
          }
        });
        userMessageId = userMessage.id;
      } catch (error) {
        console.error('Error storing user message:', error);
      }
    }

    // Store the bot response
    let botMessageId = null;
    if (sessionId) {
      try {
        const botMessage = await ChatMessage.create({
          sessionId,
          messageType: 'bot',
          content: aiResponse.answer,
          companyId: parseInt(companyId),
          ipAddress,
          metadata: {
            confidence: aiResponse.confidence,
            sources: aiResponse.sources,
            suggestedActions: aiResponse.suggestedActions,
            quickReplies: aiResponse.quickReplies,
            timestamp: new Date().toISOString()
          }
        });
        botMessageId = botMessage.id;
      } catch (error) {
        console.error('Error storing bot message:', error);
      }
    }

    // Update session activity if session token provided
    if (sessionToken) {
      try {
        const session = await VisitorSession.findOne({
          where: { sessionToken, isActive: true }
        });
        if (session) {
          session.messageCount = (session.messageCount || 0) + 1;
          session.lastActivity = new Date();
          await session.save();
        }
      } catch (error) {
        console.error('Error updating session:', error);
      }
    }

    res.json({
      success: true,
      data: {
        messageId: botMessageId,
        userMessageId,
        response: aiResponse.answer,
        confidence: aiResponse.confidence,
        sources: aiResponse.sources,
        suggestedActions: aiResponse.suggestedActions,
        quickReplies: aiResponse.quickReplies,
        typing: false,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || `session_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Enhanced chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Search for relevant FAQs
 */
const searchRelevantFAQs = async (query, companyId) => {
  try {
    const keywords = extractKeywords(query);
    
    if (keywords.length === 0) {
      return [];
    }

    // Search in questions and answers using FULLTEXT if available
    const faqs = await FAQ.findAll({
      where: {
        companyId: parseInt(companyId),
        isActive: true,
        [Op.or]: [
          {
            question: {
              [Op.like]: `%${keywords.join('%')}%`
            }
          },
          {
            answer: {
              [Op.like]: `%${keywords.join('%')}%`
            }
          }
        ]
      },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });

    return faqs.map(faq => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      relevance: calculateRelevance(query, faq.question + ' ' + faq.answer)
    }));

  } catch (error) {
    console.error('FAQ search error:', error);
    return [];
  }
};

/**
 * Generate enhanced AI response
 */
const generateEnhancedResponse = async (query, faqResults, companyId) => {
  try {
    // If we have relevant FAQs, use them
    if (faqResults.length > 0) {
      const bestMatch = faqResults[0];
      return {
        answer: bestMatch.answer,
        confidence: bestMatch.relevance,
        sources: [`FAQ: ${bestMatch.question}`],
        quickReplies: generateQuickReplies(query, companyId)
      };
    }

    // Generate contextual response for common queries
    const contextualResponse = generateContextualResponse(query);
    
    return {
      answer: contextualResponse.message,
      confidence: 0.7,
      sources: ['AI Assistant'],
      
      quickReplies: generateQuickReplies(query, companyId)
    };

  } catch (error) {
    console.error('AI response error:', error);
    return {
      answer: "I'm here to help! Could you please rephrase your question or try asking about our services?",
      confidence: 0.5,
      sources: ['Default Response'],

      quickReplies: ['What services do you offer?', 'How can I contact you?', 'Business hours?']
    };
  }
};

/**
 * Generate contextual responses for common queries
 */
const generateContextualResponse = (query) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('hello') || lowerQuery.includes('hi') || lowerQuery.includes('hey')) {
    return {
      message: "Hello! 👋 Welcome! I'm here to help you with any questions you might have. What would you like to know about our services?",
      actions: ['Browse services', 'Contact information', 'Ask a question']
    };
  }
  
  if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('pricing')) {
    return {
      message: "I'd be happy to help you with pricing information! 💰 Our pricing varies based on your specific needs. Would you like me to connect you with our sales team for a personalized quote?",
      actions: ['Get pricing quote', 'View pricing tiers', 'Contact sales']
    };
  }
  
  if (lowerQuery.includes('contact') || lowerQuery.includes('phone') || lowerQuery.includes('email')) {
    return {
      message: "Here are the best ways to reach us! 📞 You can contact our support team, and we'll be happy to assist you further.",
      actions: ['View contact info', 'Schedule a call', 'Send message']
    };
  }
  
  if (lowerQuery.includes('help') || lowerQuery.includes('support')) {
    return {
      message: "I'm here to help! 🤝 You can ask me about our services, pricing, contact information, or anything else you'd like to know.",
      actions: ['Common questions', 'Technical support', 'Account help']
    };
  }
  
  return {
    message: "That's a great question! 🤔 While I search for the most relevant information, is there anything specific about our services you'd like to know more about?",
    actions: ['Browse services', 'Contact support', 'Ask another way']
  };
};

/**
 * Generate quick reply suggestions
 */
const generateQuickReplies = (query, companyId) => {
  const commonQuickReplies = [
    'What services do you offer?',
    'How much does it cost?',
    'How can I contact you?',
    'What are your business hours?',
    'Do you offer support?',
    'Can I get a demo?'
  ];
  
  // Return 3 random quick replies
  return commonQuickReplies.sort(() => 0.5 - Math.random()).slice(0, 3);
};

/**
 * Handle message reactions (like/dislike)
 */
const handleMessageReaction = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { messageId, reaction, sessionToken } = req.body;

    if (!messageId || !reaction) {
      return res.status(400).json({
        success: false,
        message: 'Message ID and reaction are required'
      });
    }

    // Find and update the message
    const message = await ChatMessage.findByPk(messageId);
    if (message) {
      const metadata = message.metadata || {};
      metadata.reaction = reaction;
      metadata.reactionTimestamp = new Date().toISOString();
      
      await message.update({ metadata });
    }

    res.json({
      success: true,
      data: {
        messageId,
        reaction,
        message: reaction === 'helpful' ? 'Thank you for your feedback!' : 'We\'ll work on improving our responses.'
      }
    });

  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process reaction'
    });
  }
};

/**
 * Get typing indicator status
 */
const getTypingStatus = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Simulate typing delay for AI processing
    const { query } = req.query;
    const processingTime = Math.min(query ? query.length * 50 : 1000, 3000);

    setTimeout(() => {
      res.json({
        success: true,
        data: {
          isTyping: false,
          estimatedResponseTime: processingTime
        }
      });
    }, 500);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get typing status'
    });
  }
};

/**
 * Helper function to extract keywords
 */
const extractKeywords = (query) => {
  if (!query || typeof query !== 'string') return [];
  
  const cleanQuery = query.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = cleanQuery.split(/\s+/).filter(word => 
    word.length >= 2 && 
    !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
  );
  
  return [...new Set(words)];
};

/**
 * Calculate relevance score
 */
const calculateRelevance = (query, text) => {
  const queryWords = extractKeywords(query);
  const textWords = extractKeywords(text);
  
  if (queryWords.length === 0) return 0;
  
  const matches = queryWords.filter(word => 
    textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
  );
  
  return matches.length / queryWords.length;
};

module.exports = {
  sendEnhancedMessage,
  handleMessageReaction,
  getTypingStatus
};
