const express = require('express');
const router = express.Router();
const { Lead } = require('../../../models');
const logger = require('../../../utils/logger');

/**
 * @swagger
 * /api/widget/chat/message:
 *   post:
 *     summary: Send a chat message
 *     tags: [Widget - Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               widgetId:
 *                 type: string
 *               sessionId:
 *                 type: string
 */
router.post('/message', (req, res) => {
  const { message, widgetId, sessionId } = req.body;
  
  // Mock response - in real implementation, this would:
  // 1. Check FAQ database for matching questions
  // 2. Use LLM for complex queries
  // 3. Store conversation history
  // 4. Generate appropriate response
  
  const mockResponses = [
    "Thank you for your message! I'm here to help you with any questions you might have.",
    "I understand you're asking about that. Let me provide you with the most relevant information.",
    "That's a great question! Here's what you need to know...",
    "I found some information that might help you with your inquiry."
  ];
  
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  
  res.json({
    success: true,
    message: 'Message processed successfully',
    data: {
      response: randomResponse,
      sessionId,
      timestamp: new Date().toISOString(),
      suggestedQuestions: [
        "How can I contact support?",
        "What are your business hours?",
        "How do I reset my password?"
      ]
    }
  });
});

/**
 * @swagger
 * /api/widget/chat/lead:
 *   post:
 *     summary: Create a lead from chat widget (Public - No Authentication)
 *     tags: [Widget - Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - widgetId
 *             properties:
 *               companyId:
 *                 type: integer
 *                 description: Company ID for the lead (optional, defaults to 1)
 *               widgetId:
 *                 type: string
 *                 description: Widget ID that generated the lead
 *               name:
 *                 type: string
 *                 description: Visitor's name
 *               email:
 *                 type: string
 *                 description: Visitor's email
 *               phone:
 *                 type: string
 *                 description: Visitor's phone number
 *               message:
 *                 type: string
 *                 description: Initial message from visitor
 *               sessionId:
 *                 type: string
 *                 description: Chat session ID
 *               userAgent:
 *                 type: string
 *                 description: Browser user agent
 *               ipAddress:
 *                 type: string
 *                 description: Visitor's IP address
 *               referrer:
 *                 type: string
 *                 description: Referring URL
 *               currentPage:
 *                 type: string
 *                 description: Current page URL
 *               utmSource:
 *                 type: string
 *                 description: UTM source parameter
 *               utmMedium:
 *                 type: string
 *                 description: UTM medium parameter
 *               utmCampaign:
 *                 type: string
 *                 description: UTM campaign parameter
 *     responses:
 *       201:
 *         description: Lead created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     leadId:
 *                       type: integer
 *                     visitorId:
 *                       type: string
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/lead', async (req, res) => {
  try {
    const {
      companyId,
      widgetId,
      name,
      email,
      phone,
      message,
      sessionId,
      userAgent,
      ipAddress,
      referrer,
      currentPage,
      utmSource,
      utmMedium,
      utmCampaign
    } = req.body;

    // Validate required fields
    if (!widgetId) {
      return res.status(400).json({
        success: false,
        message: 'Widget ID is required'
      });
    }

    // Validate that at least name or email is provided
    if (!name && !email) {
      return res.status(400).json({
        success: false,
        message: 'Name or email is required'
      });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Generate visitor ID
    const visitorId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use provided companyId or default to 1
    const finalCompanyId = companyId ? parseInt(companyId) : 1;

    // Create lead data
    const leadData = {
      companyId: finalCompanyId,
      visitorId,
      name: name || null,
      email: email || null,
      phone: phone || null,
      source: 'Chat Widget',
      status: 'new',
      priority: 'medium',
      notes: message || null,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      referrer: referrer || null,
      currentPage: currentPage || null,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      sessionId: sessionId || null,
      firstVisit: new Date(),
      lastVisit: new Date(),
      visitCount: 1,
      hasChatted: true,
      chatCount: 1,
      lastChatAt: new Date(),
      interactions: message ? [{
        type: 'chat_message',
        content: message,
        timestamp: new Date().toISOString(),
        sessionId: sessionId
      }] : [],
      customFields: {
        widgetId: widgetId,
        chatSessionId: sessionId
      },
      metadata: {
        createdVia: 'chat_widget',
        widgetId: widgetId,
        sessionId: sessionId
      }
    };

    // Create the lead
    const lead = await Lead.create(leadData);

    logger.info(`Lead created from chat widget: ${lead.id} for company: ${finalCompanyId}`);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: {
        leadId: lead.id,
        visitorId: lead.visitorId,
        status: lead.status,
        companyId: lead.companyId
      }
    });

  } catch (error) {
    logger.error('Error creating lead from chat widget:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead'
    });
  }
});

/**
 * @swagger
 * /api/widget/chat/faq:
 *   get:
 *     summary: Get FAQ suggestions
 *     tags: [Widget - Chat]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query for FAQ
 */
router.get('/faq', (req, res) => {
  const { query } = req.query;
  
  // Mock FAQ response - in real implementation, this would search the FAQ database
  const mockFAQs = [
    {
      question: "How can I contact support?",
      answer: "You can contact our support team via email at support@example.com or by phone at 1-800-123-4567."
    },
    {
      question: "What are your business hours?",
      answer: "We're available Monday through Friday, 9 AM to 6 PM EST."
    },
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking the 'Forgot Password' link on the login page."
    }
  ];
  
  let filteredFAQs = mockFAQs;
  if (query) {
    filteredFAQs = mockFAQs.filter(faq => 
      faq.question.toLowerCase().includes(query.toLowerCase()) ||
      faq.answer.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    message: 'FAQ suggestions retrieved successfully',
    data: {
      faqs: filteredFAQs,
      query: query || null
    }
  });
});

/**
 * @swagger
 * /api/widget/chat/session:
 *   post:
 *     summary: Start a new chat session
 *     tags: [Widget - Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               widgetId:
 *                 type: string
 *               userAgent:
 *                 type: string
 *               referrer:
 *                 type: string
 */
router.post('/session', (req, res) => {
  const { widgetId, userAgent, referrer } = req.body;
  
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.json({
    success: true,
    message: 'Chat session started successfully',
    data: {
      sessionId,
      widgetId,
      welcomeMessage: "Hello! How can I help you today?",
      suggestedQuestions: [
        "How can I contact support?",
        "What are your business hours?",
        "How do I reset my password?"
      ],
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
