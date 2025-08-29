const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../middleware/auth');
const {
  getFAQs,
  getFAQById,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getCategories,
  bulkUpdateFAQs,
  reorderFAQs,
  getFAQStats,
  searchFAQs
} = require('../../../controllers/company-admin/faq-manager/faqController');

/**
 * @swagger
 * /api/company-admin/faq-manager:
 *   get:
 *     summary: Get all FAQs with filtering and pagination
 *     tags: [Company Admin - FAQ Manager]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *         description: Sort order (asc/desc)
 */
router.get('/', auth, authorize('company_admin', 'super_admin'), getFAQs);

/**
 * @swagger
 * /api/company-admin/faq-manager:
 *   post:
 *     summary: Create a new FAQ
 *     tags: [Company Admin - FAQ Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               searchKeywords:
 *                 type: array
 *                 items:
 *                   type: string
 *               order:
 *                 type: number
 */
router.post('/', auth, authorize('company_admin', 'super_admin'), createFAQ);

/**
 * @swagger
 * /api/company-admin/faq-manager/categories:
 *   get:
 *     summary: Get FAQ categories
 *     tags: [Company Admin - FAQ Manager]
 */
router.get('/categories', auth, authorize('company_admin', 'super_admin'), getCategories);

/**
 * @swagger
 * /api/company-admin/faq-manager/stats:
 *   get:
 *     summary: Get FAQ statistics
 *     tags: [Company Admin - FAQ Manager]
 */
router.get('/stats', auth, authorize('company_admin', 'super_admin'), getFAQStats);

/**
 * @swagger
 * /api/company-admin/faq-manager/search:
 *   get:
 *     summary: Search FAQs
 *     tags: [Company Admin - FAQ Manager]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results
 */
router.get('/search', auth, authorize('company_admin', 'super_admin'), searchFAQs);

/**
 * @swagger
 * /api/company-admin/faq-manager/bulk-update:
 *   put:
 *     summary: Bulk update FAQs
 *     tags: [Company Admin - FAQ Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               faqIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 */
router.put('/bulk-update', auth, authorize('company_admin', 'super_admin'), bulkUpdateFAQs);

/**
 * @swagger
 * /api/company-admin/faq-manager/reorder:
 *   put:
 *     summary: Reorder FAQs
 *     tags: [Company Admin - FAQ Manager]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               faqOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     order:
 *                       type: number
 */
router.put('/reorder', auth, authorize('company_admin', 'super_admin'), reorderFAQs);

/**
 * @swagger
 * /api/company-admin/faq-manager/{id}:
 *   get:
 *     summary: Get FAQ by ID
 *     tags: [Company Admin - FAQ Manager]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', auth, authorize('company_admin', 'super_admin'), getFAQById);

/**
 * @swagger
 * /api/company-admin/faq-manager/{id}:
 *   put:
 *     summary: Update FAQ
 *     tags: [Company Admin - FAQ Manager]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', auth, authorize('company_admin', 'super_admin'), updateFAQ);

/**
 * @swagger
 * /api/company-admin/faq-manager/{id}:
 *   delete:
 *     summary: Delete FAQ
 *     tags: [Company Admin - FAQ Manager]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', auth, authorize('company_admin', 'super_admin'), deleteFAQ);

module.exports = router;
