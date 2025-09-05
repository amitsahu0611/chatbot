const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../middleware/auth');
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  bulkUpdateLeads,
  getLeadStats,
  searchLeads,
  exportLeads,
  getLeadChatHistory
} = require('../../../controllers/company-admin/lead-viewer/leadController');

/**
 * @swagger
 * /api/company-admin/lead-viewer:
 *   get:
 *     summary: Get all leads with filtering and pagination
 *     tags: [Company Admin - Lead Viewer]
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
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Lead source filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Lead status filter
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Lead priority filter
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
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Company ID (for super admin context)
 */
router.get('/', auth, authorize('company_admin', 'super_admin'), getLeads);

/**
 * @swagger
 * /api/company-admin/lead-viewer:
 *   post:
 *     summary: Create new lead
 *     tags: [Company Admin - Lead Viewer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               source:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               notes:
 *                 type: string
 */
router.post('/', auth, authorize('company_admin', 'super_admin'), createLead);

/**
 * @swagger
 * /api/company-admin/lead-viewer/search:
 *   get:
 *     summary: Search leads
 *     tags: [Company Admin - Lead Viewer]
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
router.get('/search', auth, authorize('company_admin', 'super_admin'), searchLeads);

/**
 * @swagger
 * /api/company-admin/lead-viewer/export:
 *   get:
 *     summary: Export leads to CSV or JSON
 *     tags: [Company Admin - Lead Viewer]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter leads
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by lead source
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by lead status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by lead priority
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Company ID (for super admin context)
 *     responses:
 *       200:
 *         description: Leads exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     leads:
 *                       type: array
 *                     count:
 *                       type: integer
 *                     exportedAt:
 *                       type: string
 */
router.get('/export', auth, authorize('company_admin', 'super_admin'), exportLeads);

/**
 * @swagger
 * /api/company-admin/lead-viewer/{id}/chat-history:
 *   get:
 *     summary: Get chat history for a lead
 *     tags: [Company Admin - Lead Viewer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Lead ID
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
 *           default: 10
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
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
 *                     lead:
 *                       type: object
 *                     messages:
 *                       type: array
 *                     pagination:
 *                       type: object
 */
router.get('/:id/chat-history', auth, authorize('company_admin', 'super_admin'), getLeadChatHistory);

/**
 * @swagger
 * /api/company-admin/lead-viewer/bulk-update:
 *   put:
 *     summary: Bulk update leads
 *     tags: [Company Admin - Lead Viewer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 */
router.put('/bulk-update', auth, authorize('company_admin', 'super_admin'), bulkUpdateLeads);

/**
 * @swagger
 * /api/company-admin/lead-viewer/stats:
 *   get:
 *     summary: Get lead statistics
 *     tags: [Company Admin - Lead Viewer]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Period in days
 */
router.get('/stats', auth, authorize('company_admin', 'super_admin'), getLeadStats);

/**
 * @swagger
 * /api/company-admin/lead-viewer/{id}:
 *   get:
 *     summary: Get lead by ID
 *     tags: [Company Admin - Lead Viewer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', auth, authorize('company_admin', 'super_admin'), getLeadById);

/**
 * @swagger
 * /api/company-admin/lead-viewer/{id}:
 *   put:
 *     summary: Update lead
 *     tags: [Company Admin - Lead Viewer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', auth, authorize('company_admin', 'super_admin'), updateLead);

/**
 * @swagger
 * /api/company-admin/lead-viewer/{id}:
 *   delete:
 *     summary: Delete lead
 *     tags: [Company Admin - Lead Viewer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', auth, authorize('company_admin', 'super_admin'), deleteLead);



module.exports = router;
