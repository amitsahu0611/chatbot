const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../middleware/auth');
const {
  getSupportSettings,
  updateSupportSettings,
  testEmail,
  testPhone,
  testSlack,
  getBusinessHoursStatus,
  resetToDefault
} = require('../../../controllers/company-admin/support-settings/supportSettingsController');

/**
 * @swagger
 * /api/company-admin/support-settings:
 *   get:
 *     summary: Get support settings
 *     tags: [Company Admin - Support Settings]
 */
router.get('/', auth, authorize('company_admin', 'super_admin'), getSupportSettings);

/**
 * @swagger
 * /api/company-admin/support-settings:
 *   put:
 *     summary: Update support settings
 *     tags: [Company Admin - Support Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: object
 *               email:
 *                 type: object
 *               chat:
 *                 type: object
 *               social:
 *                 type: object
 *               escalation:
 *                 type: object
 *               notifications:
 *                 type: object
 *               businessHours:
 *                 type: object
 *               timezone:
 *                 type: string
 */
router.put('/', auth, authorize('company_admin', 'super_admin'), updateSupportSettings);

/**
 * @swagger
 * /api/company-admin/support-settings/test-email:
 *   post:
 *     summary: Test email configuration
 *     tags: [Company Admin - Support Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 */
router.post('/test-email', auth, authorize('company_admin', 'super_admin'), testEmail);

/**
 * @swagger
 * /api/company-admin/support-settings/test-phone:
 *   post:
 *     summary: Test phone configuration
 *     tags: [Company Admin - Support Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 */
router.post('/test-phone', auth, authorize('company_admin', 'super_admin'), testPhone);

/**
 * @swagger
 * /api/company-admin/support-settings/test-slack:
 *   post:
 *     summary: Test Slack webhook configuration
 *     tags: [Company Admin - Support Settings]
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
router.post('/test-slack', auth, authorize('company_admin', 'super_admin'), testSlack);

/**
 * @swagger
 * /api/company-admin/support-settings/business-hours-status:
 *   get:
 *     summary: Get current business hours status
 *     tags: [Company Admin - Support Settings]
 */
router.get('/business-hours-status', auth, authorize('company_admin', 'super_admin'), getBusinessHoursStatus);

/**
 * @swagger
 * /api/company-admin/support-settings/reset:
 *   post:
 *     summary: Reset support settings to default
 *     tags: [Company Admin - Support Settings]
 */
router.post('/reset', auth, authorize('company_admin', 'super_admin'), resetToDefault);

module.exports = router;
