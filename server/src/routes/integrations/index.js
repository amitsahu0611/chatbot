const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/integrations:
 *   get:
 *     summary: Get all integrations
 *     tags: [Integrations]
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Integrations retrieved successfully',
    data: [
      {
        id: 1,
        name: 'WhatsApp Business',
        type: 'messaging',
        status: 'connected',
        icon: 'whatsapp',
        description: 'Connect your WhatsApp Business account to receive messages directly in the chat widget',
        settings: {
          phoneNumber: '+1234567890',
          businessName: 'My Company',
          webhookUrl: 'https://api.example.com/webhooks/whatsapp'
        },
        stats: {
          messagesReceived: 1250,
          messagesSent: 1180,
          responseRate: 94.4
        },
        lastSync: '2024-01-15T10:30:00.000Z'
      },
      {
        id: 2,
        name: 'Telegram Bot',
        type: 'messaging',
        status: 'disconnected',
        icon: 'telegram',
        description: 'Connect your Telegram bot to handle customer inquiries',
        settings: {
          botToken: '',
          botUsername: '',
          webhookUrl: ''
        },
        stats: {
          messagesReceived: 0,
          messagesSent: 0,
          responseRate: 0
        },
        lastSync: null
      },
      {
        id: 3,
        name: 'Slack',
        type: 'notification',
        status: 'connected',
        icon: 'slack',
        description: 'Receive notifications in your Slack workspace',
        settings: {
          workspace: 'my-workspace',
          channel: '#customer-support',
          webhookUrl: 'https://hooks.slack.com/services/xxx/yyy/zzz'
        },
        stats: {
          notificationsSent: 450,
          lastNotification: '2024-01-15T09:15:00.000Z'
        },
        lastSync: '2024-01-15T09:15:00.000Z'
      },
      {
        id: 4,
        name: 'Email Integration',
        type: 'email',
        status: 'connected',
        icon: 'email',
        description: 'Send and receive emails through the platform',
        settings: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          email: 'support@company.com'
        },
        stats: {
          emailsSent: 1250,
          emailsReceived: 890,
          responseRate: 71.2
        },
        lastSync: '2024-01-15T08:45:00.000Z'
      }
    ]
  });
});

/**
 * @swagger
 * /api/integrations/whatsapp:
 *   post:
 *     summary: Connect WhatsApp Business
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               businessName:
 *                 type: string
 *               accessToken:
 *                 type: string
 */
router.post('/whatsapp', (req, res) => {
  const { phoneNumber, businessName, accessToken } = req.body;
  
  // Mock WhatsApp connection
  res.status(201).json({
    success: true,
    message: 'WhatsApp Business connected successfully',
    data: {
      id: Date.now(),
      name: 'WhatsApp Business',
      type: 'messaging',
      status: 'connected',
      settings: {
        phoneNumber,
        businessName,
        webhookUrl: `https://api.example.com/webhooks/whatsapp/${Date.now()}`
      },
      connectedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/integrations/telegram:
 *   post:
 *     summary: Connect Telegram Bot
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               botToken:
 *                 type: string
 *               botUsername:
 *                 type: string
 */
router.post('/telegram', (req, res) => {
  const { botToken, botUsername } = req.body;
  
  // Mock Telegram connection
  res.status(201).json({
    success: true,
    message: 'Telegram Bot connected successfully',
    data: {
      id: Date.now(),
      name: 'Telegram Bot',
      type: 'messaging',
      status: 'connected',
      settings: {
        botToken,
        botUsername,
        webhookUrl: `https://api.example.com/webhooks/telegram/${Date.now()}`
      },
      connectedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/integrations/slack:
 *   post:
 *     summary: Connect Slack
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               webhookUrl:
 *                 type: string
 *               channel:
 *                 type: string
 */
router.post('/slack', (req, res) => {
  const { webhookUrl, channel } = req.body;
  
  // Mock Slack connection
  res.status(201).json({
    success: true,
    message: 'Slack connected successfully',
    data: {
      id: Date.now(),
      name: 'Slack',
      type: 'notification',
      status: 'connected',
      settings: {
        webhookUrl,
        channel,
        workspace: 'my-workspace'
      },
      connectedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/integrations/{id}:
 *   get:
 *     summary: Get integration by ID
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Integration retrieved successfully',
    data: {
      id,
      name: 'WhatsApp Business',
      type: 'messaging',
      status: 'connected',
      icon: 'whatsapp',
      description: 'Connect your WhatsApp Business account to receive messages directly in the chat widget',
      settings: {
        phoneNumber: '+1234567890',
        businessName: 'My Company',
        webhookUrl: 'https://api.example.com/webhooks/whatsapp'
      },
      stats: {
        messagesReceived: 1250,
        messagesSent: 1180,
        responseRate: 94.4
      },
      lastSync: '2024-01-15T10:30:00.000Z'
    }
  });
});

/**
 * @swagger
 * /api/integrations/{id}:
 *   put:
 *     summary: Update integration
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { settings, status } = req.body;
  
  res.json({
    success: true,
    message: 'Integration updated successfully',
    data: {
      id,
      settings,
      status,
      updatedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/integrations/{id}:
 *   delete:
 *     summary: Disconnect integration
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Integration disconnected successfully',
    data: { id }
  });
});

/**
 * @swagger
 * /api/integrations/{id}/test:
 *   post:
 *     summary: Test integration
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/test', (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Integration test completed successfully',
    data: {
      integrationId: id,
      testResult: 'success',
      message: 'Test message sent successfully',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
