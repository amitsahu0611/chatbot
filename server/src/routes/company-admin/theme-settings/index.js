const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../middleware/auth');
const {
  getThemeSettings,
  updateThemeSettings,
  resetThemeSettings,
  getWidgetThemeSettings,
  generateThemeCSS
} = require('../../../controllers/company-admin/ThemeSettingsController');

/**
 * @swagger
 * /api/company-admin/theme-settings:
 *   get:
 *     summary: Get theme settings for company
 *     tags: [Company Admin - Theme Settings]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', auth, authorize('company_admin', 'super_admin'), getThemeSettings);

/**
 * @swagger
 * /api/company-admin/theme-settings:
 *   put:
 *     summary: Update theme settings for company
 *     tags: [Company Admin - Theme Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               primaryColor:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *               primaryBackgroundColor:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *               secondaryColor:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *               accentColor:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *               textColor:
 *                 type: string
 *                 pattern: '^#[0-9A-F]{6}$'
 *               themeMode:
 *                 type: string
 *                 enum: [light, dark, auto]
 *               customCSS:
 *                 type: string
 */
router.put('/', auth, authorize('company_admin', 'super_admin'), updateThemeSettings);

/**
 * @swagger
 * /api/company-admin/theme-settings/reset:
 *   post:
 *     summary: Reset theme settings to default
 *     tags: [Company Admin - Theme Settings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/reset', auth, authorize('company_admin', 'super_admin'), resetThemeSettings);

/**
 * @swagger
 * /api/widget/theme/{companyId}:
 *   get:
 *     summary: Get theme settings for widget rendering (public)
 *     tags: [Widget - Theme]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 */
router.get('/widget/:companyId', getWidgetThemeSettings);

/**
 * @swagger
 * /api/widget/theme/{companyId}/css:
 *   get:
 *     summary: Get CSS variables for widget (public)
 *     tags: [Widget - Theme]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *     responses:
 *       200:
 *         description: CSS variables
 *         content:
 *           text/css:
 *             schema:
 *               type: string
 */
router.get('/widget/:companyId/css', generateThemeCSS);

module.exports = router;
