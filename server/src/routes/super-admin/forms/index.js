const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const {
  getAllForms,
  getCompanyForms,
  toggleFormStatus,
  bulkToggleCompanyForms,
  getFormStats
} = require('../../../controllers/super-admin/formManagementController');

/**
 * @swagger
 * /api/super-admin/forms:
 *   get:
 *     summary: Get all forms across all companies
 *     tags: [Super Admin - Forms]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of forms per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by form name or description
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filter by company ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: formType
 *         schema:
 *           type: string
 *           enum: [contact, support, lead, custom]
 *         description: Filter by form type
 *     responses:
 *       200:
 *         description: List of forms with pagination
 *       403:
 *         description: Access denied - Super admin required
 */
router.get('/', auth, getAllForms);

/**
 * @swagger
 * /api/super-admin/forms/stats:
 *   get:
 *     summary: Get form statistics for dashboard
 *     tags: [Super Admin - Forms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Form statistics
 *       403:
 *         description: Access denied - Super admin required
 */
router.get('/stats', auth, getFormStats);

/**
 * @swagger
 * /api/super-admin/forms/company/{companyId}:
 *   get:
 *     summary: Get all forms for a specific company
 *     tags: [Super Admin - Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive forms
 *     responses:
 *       200:
 *         description: Company forms
 *       404:
 *         description: Company not found
 *       403:
 *         description: Access denied - Super admin required
 */
router.get('/company/:companyId', auth, getCompanyForms);

/**
 * @swagger
 * /api/super-admin/forms/{formId}/toggle:
 *   put:
 *     summary: Activate or deactivate a specific form
 *     tags: [Super Admin - Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Form ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New active status
 *             required:
 *               - isActive
 *     responses:
 *       200:
 *         description: Form status updated successfully
 *       404:
 *         description: Form not found
 *       403:
 *         description: Access denied - Super admin required
 */
router.put('/:formId/toggle', auth, toggleFormStatus);

/**
 * @swagger
 * /api/super-admin/forms/company/{companyId}/bulk-toggle:
 *   put:
 *     summary: Bulk activate or deactivate forms for a company
 *     tags: [Super Admin - Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New active status
 *               formIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Specific form IDs to update (optional - if not provided, all forms will be updated)
 *             required:
 *               - isActive
 *     responses:
 *       200:
 *         description: Forms updated successfully
 *       404:
 *         description: Company not found
 *       403:
 *         description: Access denied - Super admin required
 */
router.put('/company/:companyId/bulk-toggle', auth, bulkToggleCompanyForms);

module.exports = router;
