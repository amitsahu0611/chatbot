const express = require('express');
const router = express.Router();
const { 
  sendEnhancedMessage, 
  handleMessageReaction, 
  getTypingStatus 
} = require('../../controllers/widget/enhancedChatController');

// CORS middleware for widget routes
const widgetCORS = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
};

router.use(widgetCORS);

/**
 * @swagger
 * /api/widget/enhanced-chat/message:
 *   post:
 *     summary: Send enhanced chat message with new features
 *     tags: [Widget - Enhanced Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content
 *               companyId:
 *                 type: string
 *                 description: Company ID
 *               sessionId:
 *                 type: string
 *                 description: Chat session ID
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *               quickReply:
 *                 type: boolean
 *                 default: false
 *               sessionToken:
 *                 type: string
 *                 description: Visitor session token
 *     responses:
 *       200:
 *         description: Enhanced message response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     sources:
 *                       type: array
 *                       items:
 *                         type: string
 *                     suggestedActions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     quickReplies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     timestamp:
 *                       type: string
 */
router.post('/message', sendEnhancedMessage);

/**
 * @swagger
 * /api/widget/enhanced-chat/reaction:
 *   post:
 *     summary: React to a chat message (helpful/not helpful)
 *     tags: [Widget - Enhanced Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: The message ID to react to
 *               reaction:
 *                 type: string
 *                 enum: [helpful, not_helpful, excellent, poor]
 *                 description: Type of reaction
 *               sessionToken:
 *                 type: string
 *                 description: Visitor session token
 *     responses:
 *       200:
 *         description: Reaction recorded
 */
router.post('/reaction', handleMessageReaction);

/**
 * @swagger
 * /api/widget/enhanced-chat/typing:
 *   get:
 *     summary: Get typing indicator status
 *     tags: [Widget - Enhanced Chat]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: The query being processed
 *     responses:
 *       200:
 *         description: Typing status
 */
router.get('/typing', getTypingStatus);

// Handle preflight OPTIONS requests
router.options('/message', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

router.options('/reaction', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

router.options('/typing', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

module.exports = router;
