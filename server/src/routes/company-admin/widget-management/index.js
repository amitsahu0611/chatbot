const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/auth');
const {
  getWidgets,
  createWidget,
  getWidgetById,
  updateWidget,
  deleteWidget,
  getWidgetStats,
  getWidgetEmbedCode
} = require('../../../controllers/company-admin/widget-management/widgetController');

/**
 * @swagger
 * /api/company-admin/widget-management:
 *   get:
 *     summary: Get all widgets
 *     tags: [Company Admin - Widget Management]
 */
router.get('/', auth, authorize('company_admin', 'super_admin'), getWidgets);

/**
 * @swagger
 * /api/company-admin/widget-management:
 *   post:
 *     summary: Create a new widget
 *     tags: [Company Admin - Widget Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [chat, form]
 *               domain:
 *                 type: string
 *               settings:
 *                 type: object
 */
router.post('/', auth, authorize('company_admin', 'super_admin'), createWidget);

/**
 * @swagger
 * /api/company-admin/widget-management/{id}:
 *   get:
 *     summary: Get widget by ID
 *     tags: [Company Admin - Widget Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', auth, authorize('company_admin', 'super_admin'), getWidgetById);

/**
 * @swagger
 * /api/company-admin/widget-management/{id}:
 *   put:
 *     summary: Update widget
 *     tags: [Company Admin - Widget Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', auth, authorize('company_admin', 'super_admin'), updateWidget);

/**
 * @swagger
 * /api/company-admin/widget-management/{id}:
 *   delete:
 *     summary: Delete widget
 *     tags: [Company Admin - Widget Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', auth, authorize('company_admin', 'super_admin'), deleteWidget);

/**
 * @swagger
 * /api/company-admin/widget-management/{id}/stats:
 *   get:
 *     summary: Get widget statistics
 *     tags: [Company Admin - Widget Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 */
router.get('/:id/stats', auth, authorize('company_admin', 'super_admin'), getWidgetStats);

/**
 * @swagger
 * /api/company-admin/widget-management/{id}/embed:
 *   get:
 *     summary: Get widget embed code
 *     tags: [Company Admin - Widget Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id/embed', auth, authorize('company_admin', 'super_admin'), getWidgetEmbedCode);

module.exports = router;
