const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../middleware/auth');

/**
 * @swagger
 * /api/company-admin/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Company Admin - Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/stats', auth, authorize('company_admin', 'super_admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: {
      totalLeads: 1250,
      totalForms: 8,
      totalFAQs: 45,
      activeWidgets: 3,
      conversionRate: 12.5,
      monthlyGrowth: 8.2,
      topQuestions: [
        { question: 'How do I reset my password?', count: 45 },
        { question: 'What are your business hours?', count: 32 },
        { question: 'How can I contact support?', count: 28 }
      ],
      recentLeads: [
        { id: 1, name: 'John Doe', email: 'john@example.com', source: 'Contact Form', date: '2024-01-15' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', source: 'FAQ Chat', date: '2024-01-14' }
      ]
    }
  });
});

/**
 * @swagger
 * /api/company-admin/dashboard/analytics:
 *   get:
 *     summary: Get analytics data
 *     tags: [Company Admin - Dashboard]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *         description: Time period for analytics
 */
router.get('/analytics', auth, authorize('company_admin', 'super_admin'), (req, res) => {
  const { period = '30d' } = req.query;
  
  res.json({
    success: true,
    message: 'Analytics data retrieved successfully',
    data: {
      period,
      leadsByDay: [
        { date: '2024-01-01', count: 15 },
        { date: '2024-01-02', count: 22 },
        { date: '2024-01-03', count: 18 },
        { date: '2024-01-04', count: 25 },
        { date: '2024-01-05', count: 30 }
      ],
      formSubmissions: [
        { formName: 'Contact Form', submissions: 45 },
        { formName: 'Support Request', submissions: 32 },
        { formName: 'Newsletter Signup', submissions: 28 }
      ],
      chatInteractions: [
        { date: '2024-01-01', interactions: 120 },
        { date: '2024-01-02', interactions: 145 },
        { date: '2024-01-03', interactions: 98 },
        { date: '2024-01-04', interactions: 167 },
        { date: '2024-01-05', interactions: 189 }
      ]
    }
  });
});

module.exports = router;
