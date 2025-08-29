const express = require('express');
const router = express.Router();
const { submitForm, getForm, getCompanyForms, getFormSubmissions } = require('../../../controllers/widget/form/formController');
const { auth } = require('../../../middleware/auth');

/**
 * @swagger
 * /api/widget/form/submit:
 *   post:
 *     summary: Submit form data (Public - No Authentication)
 *     tags: [Widget - Form]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - formData
 *             properties:
 *               formId:
 *                 type: integer
 *                 description: Form ID to submit to
 *               formData:
 *                 type: object
 *                 description: Form field data (flexible structure)
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID for tracking
 *               timeToComplete:
 *                 type: integer
 *                 description: Time taken to complete form (seconds)
 *               pageUrl:
 *                 type: string
 *                 description: URL where form was submitted
 *     responses:
 *       201:
 *         description: Form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     submissionId:
 *                       type: integer
 *                     leadId:
 *                       type: integer
 *                     status:
 *                       type: string
 *                     redirectUrl:
 *                       type: string
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: Form not found
 *       500:
 *         description: Internal server error
 */
router.post('/submit', submitForm);

/**
 * @swagger
 * /api/widget/form/company/{companyId}:
 *   get:
 *     summary: Get company forms (Public - No Authentication)
 *     tags: [Widget - Form]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID to get forms for
 *     responses:
 *       200:
 *         description: Company forms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       fields:
 *                         type: array
 *                       settings:
 *                         type: object
 *                       formType:
 *                         type: string
 *       400:
 *         description: Bad request - missing company ID
 *       500:
 *         description: Internal server error
 */
router.get('/company/:companyId', getCompanyForms);

/**
 * @swagger
 * /api/widget/form/{formId}:
 *   get:
 *     summary: Get form configuration (Public - No Authentication)
 *     tags: [Widget - Form]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Form ID to retrieve
 *     responses:
 *       200:
 *         description: Form configuration
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
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     fields:
 *                       type: array
 *                       items:
 *                         type: object
 *                     settings:
 *                       type: object
 *                     formType:
 *                       type: string
 *       404:
 *         description: Form not found
 *       500:
 *         description: Internal server error
 */
router.get('/:formId', getForm);

/**
 * @swagger
 * /api/widget/form/submissions:
 *   get:
 *     summary: Get form submissions (Authenticated - Company Admin)
 *     tags: [Widget - Form]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: formId
 *         schema:
 *           type: integer
 *         description: Filter by form ID
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
 *           default: 20
 *         description: Number of submissions per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by submission status
 *     responses:
 *       200:
 *         description: Form submissions
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
 *                     submissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/submissions', auth, getFormSubmissions);

module.exports = router;
