const express = require('express');
const path = require('path');
const router = express.Router();

// Import sub-routes
const searchRoutes = require('./search');
const chatRoutes = require('./chat');
const formRoutes = require('./form');
const themeSettingsRoutes = require('../company-admin/theme-settings');

/**
 * @swagger
 * /api/widget/chat.js:
 *   get:
 *     summary: Get the chatbot widget JavaScript file
 *     description: Serves the JavaScript file that clients embed on their websites
 *     tags: [Widget]
 *     responses:
 *       200:
 *         description: JavaScript file content
 *         content:
 *           application/javascript:
 *             schema:
 *               type: string
 */
// Handle OPTIONS preflight requests
router.options('/chat.js', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.status(200).end();
});

router.get('/chat.js', (req, res) => {
  const widgetPath = path.join(__dirname, '../../../public/widget/chat.js');
  
  // Disable security headers for widget scripts
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.removeHeader('Cross-Origin-Resource-Policy');
  
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for widget scripts
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  res.sendFile(widgetPath);
});

/**
 * @swagger
 * /api/widget/chat-with-theme.js:
 *   get:
 *     summary: Get the themed chatbot widget JavaScript file
 *     description: Serves the JavaScript file with theme support and custom color overrides
 *     tags: [Widget]
 *     responses:
 *       200:
 *         description: JavaScript file content with theme functionality
 *         content:
 *           application/javascript:
 *             schema:
 *               type: string
 */
router.get('/chat-with-theme.js', (req, res) => {
  const widgetPath = path.join(__dirname, '../../../public/widget/chat-with-theme.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for widget scripts
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendFile(widgetPath);
});

/**
 * @swagger
 * /api/widget/form.js:
 *   get:
 *     summary: Get the form widget JavaScript file
 *     description: Serves the JavaScript file that clients embed on their websites for contact forms
 *     tags: [Widget]
 *     responses:
 *       200:
 *         description: JavaScript file content
 *         content:
 *           application/javascript:
 *             schema:
 *               type: string
 */
router.get('/form.js', (req, res) => {
  const widgetPath = path.join(__dirname, '../../../public/widget/form.js');
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins for widget scripts
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendFile(widgetPath);
});

/**
 * @swagger
 * /api/widget/config:
 *   get:
 *     summary: Get widget configuration
 *     description: Returns configuration for a specific widget
 *     tags: [Widget]
 *     parameters:
 *       - in: query
 *         name: widgetId
 *         schema:
 *           type: string
 *         required: true
 *         description: Widget ID
 *     responses:
 *       200:
 *         description: Widget configuration
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
 *                     widgetId:
 *                       type: string
 *                     companyId:
 *                       type: integer
 *                     config:
 *                       type: object
 */
router.get('/config', async (req, res) => {
  const { widgetId } = req.query;
  
  if (!widgetId) {
    return res.status(400).json({
      success: false,
      message: 'Widget ID is required'
    });
  }

  try {
    // Import Widget model
    const Widget = require('../../models/company-admin/widget-management/Widget');
    
    // Find widget in database
    const widget = await Widget.findOne({
      where: { widgetId }
    });

    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }

    if (!widget.isActive || widget.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Widget is not active'
      });
    }

    const config = {
      widgetId: widget.widgetId,
      companyId: widget.companyId,
      config: {
        ...widget.settings,
        position: widget.settings.position || 'bottom-right',
        primaryColor: widget.settings.primaryColor || '#2563eb',
        size: widget.settings.size || 'normal',
        welcomeMessage: widget.settings.welcomeMessage || "Hello! 👋 I'm here to help you with any questions about our services."
      }
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch widget configuration'
    });
  }
});

/**
 * @swagger
 * /api/widget/health:
 *   get:
 *     summary: Widget health check
 *     description: Check if the widget service is running
 *     tags: [Widget]
 *     responses:
 *       200:
 *         description: Widget service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 timestamp:
 *                   type: string
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Widget service is running',
    timestamp: new Date().toISOString()
  });
});

// Use sub-routes
router.use('/search', searchRoutes);
router.use('/chat', chatRoutes);
router.use('/form', formRoutes);
router.use('/theme', themeSettingsRoutes);

module.exports = router;
