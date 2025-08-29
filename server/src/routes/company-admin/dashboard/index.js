const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../middleware/auth');
const { getDashboardStats, getRecentActivity } = require('../../../controllers/company-admin/dashboard/dashboardController');

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
router.get('/stats', auth, getDashboardStats);

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
router.get('/activity', auth, getRecentActivity);

module.exports = router;
