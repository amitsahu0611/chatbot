const express = require('express');
const router = express.Router();
const { aiSearch, getSearchSuggestions } = require('../../controllers/widget/searchController');
const { publicAiSearch, getChatHistory, getPublicSearchSuggestions, getPublicFaqAnswer, storeMessage, createPublicLead } = require('../../controllers/widget/publicSearchController');
const { trackFormSubmission } = require('../../controllers/widget/formTrackingController');
const { auth } = require('../../middleware/auth');

// CORS middleware for widget routes
const widgetCORS = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
};

// Apply CORS to all widget routes
router.use(widgetCORS);

/**
 * @swagger
 * /api/widget/search/ai:
 *   get:
 *     summary: AI-powered search using FAQs (Authenticated)
 *     tags: [Widget - Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of FAQs to use for context
 *     responses:
 *       200:
 *         description: AI response generated from FAQs
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
 *                     answer:
 *                       type: string
 *                     source:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     relatedFAQs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           question:
 *                             type: string
 *                           category:
 *                             type: string
 *                           views:
 *                             type: integer
 *                           helpfulCount:
 *                             type: integer
 */
router.get('/ai', auth, aiSearch);

/**
 * @swagger
 * /api/widget/search/ai/public:
 *   get:
 *     summary: Public AI-powered search using FAQs (No authentication required)
 *     tags: [Widget - Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of FAQs to use for context
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Company ID for FAQ filtering
 *     responses:
 *       200:
 *         description: AI response generated from FAQs
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
 *                     answer:
 *                       type: string
 *                     source:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     relatedFAQs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           question:
 *                             type: string
 *                           category:
 *                             type: string
 *                           views:
 *                             type: integer
 *                           helpfulCount:
 *                             type: integer
 */
router.get('/ai/public', publicAiSearch);

/**
 * @swagger
 * /api/widget/search/suggestions:
 *   get:
 *     summary: Get search suggestions based on FAQs
 *     tags: [Widget - Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Partial search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: Search suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           question:
 *                             type: string
 *                           category:
 *                             type: string
 *                           views:
 *                             type: integer
 *                           helpfulCount:
 *                             type: integer
 */
router.get('/suggestions', auth, getSearchSuggestions);

/**
 * @swagger
 * /api/widget/search/suggestions/public:
 *   get:
 *     summary: Get search suggestions based on FAQs (Public - No Authentication)
 *     tags: [Widget - Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of suggestions to return
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID for FAQ search
 *     responses:
 *       200:
 *         description: Search suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       question:
 *                         type: string
 *                       category:
 *                         type: string
 *                       views:
 *                         type: integer
 *                       helpfulCount:
 *                         type: integer
 *       400:
 *         description: Bad request - missing query or companyId
 *       500:
 *         description: Internal server error
 */
router.get('/suggestions/public', getPublicSearchSuggestions);

/**
 * @swagger
 * /api/widget/search/faq/public:
 *   get:
 *     summary: Get specific FAQ answer (Public - No Authentication)
 *     tags: [Widget - Search]
 *     parameters:
 *       - in: query
 *         name: faqId
 *         required: true
 *         schema:
 *           type: integer
 *         description: FAQ ID to get answer for
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID for FAQ search
 *     responses:
 *       200:
 *         description: FAQ answer
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
 *                     answer:
 *                       type: string
 *                     question:
 *                       type: string
 *                     category:
 *                       type: string
 *                     views:
 *                       type: integer
 *                     helpfulCount:
 *                       type: integer
 *       400:
 *         description: Bad request - missing faqId or companyId
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Internal server error
 */
router.get('/faq/public', getPublicFaqAnswer);

/**
 * @swagger
 * /api/widget/search/message:
 *   post:
 *     summary: Store individual message (Public - No Authentication)
 *     tags: [Widget - Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageType
 *               - content
 *               - companyId
 *             properties:
 *               messageType:
 *                 type: string
 *                 enum: [user, bot]
 *                 description: Type of message
 *               content:
 *                 type: string
 *                 description: Message content
 *               companyId:
 *                 type: integer
 *                 description: Company ID
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID
 *     responses:
 *       200:
 *         description: Message stored successfully
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
 *                     id:
 *                       type: integer
 *                     sessionId:
 *                       type: string
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/message', storeMessage);

/**
 * @swagger
 * /api/widget/search/history:
 *   get:
 *     summary: Get chat history for IP address (Public - No Authentication)
 *     tags: [Widget - Search]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID for chat history
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Chat history for the IP address
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           type:
 *                             type: string
 *                           content:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                           metadata:
 *                             type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalMessages:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *                     currentSessionId:
 *                       type: string
 *       400:
 *         description: Bad request - missing companyId
 *       500:
 *         description: Internal server error
 */
router.get('/history', getChatHistory);

/**
 * @swagger
 * /api/widget/search/lead/public:
 *   post:
 *     summary: Create lead from chatbot welcome form (Public - No Authentication)
 *     tags: [Widget - Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - companyId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Lead's name
 *               email:
 *                 type: string
 *                 description: Lead's email address
 *               topic:
 *                 type: string
 *                 description: Topic of interest (optional)
 *               companyId:
 *                 type: integer
 *                 description: Company ID
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
 *                     id:
 *                       type: integer
 *                     visitorId:
 *                       type: string
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/lead/public', createPublicLead);

/**
 * @swagger
 * /api/widget/search/form/track:
 *   post:
 *     summary: Track form submission and create lead (Public - No Authentication)
 *     tags: [Widget - Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - formData
 *             properties:
 *               companyId:
 *                 type: integer
 *                 description: Company ID
 *               formData:
 *                 type: object
 *                 description: Form data (must contain at least name or email)
 *               formType:
 *                 type: string
 *                 description: Type of form (default custom)
 *               source:
 *                 type: string
 *                 description: Source of the form (default Website Form)
 *               sessionId:
 *                 type: string
 *                 description: Session ID for tracking
 *               timeToComplete:
 *                 type: integer
 *                 description: Time to complete form in seconds
 *               pageUrl:
 *                 type: string
 *                 description: URL where form was submitted
 *     responses:
 *       201:
 *         description: Form tracked and lead processed successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/form/track', trackFormSubmission);

// Handle preflight OPTIONS requests for public endpoints
router.options('/ai/public', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

router.options('/history', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

router.options('/message', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

module.exports = router;
