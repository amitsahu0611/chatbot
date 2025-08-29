const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../../../middleware/auth');

/**
 * @swagger
 * /api/company-admin/form-builder:
 *   get:
 *     summary: Get all forms
 *     tags: [Company Admin - Form Builder]
 *     responses:
 *       200:
 *         description: List of forms
 */
router.get('/', auth, authorize('company_admin', 'super_admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Forms retrieved successfully',
    data: [
      {
        id: 1,
        name: 'Contact Form',
        description: 'General contact form for customer inquiries',
        fields: [
          { type: 'text', label: 'Name', required: true },
          { type: 'email', label: 'Email', required: true },
          { type: 'textarea', label: 'Message', required: true }
        ],
        submissions: 45,
        createdAt: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 2,
        name: 'Support Request',
        description: 'Form for technical support requests',
        fields: [
          { type: 'text', label: 'Subject', required: true },
          { type: 'select', label: 'Priority', options: ['Low', 'Medium', 'High'], required: true },
          { type: 'textarea', label: 'Description', required: true }
        ],
        submissions: 32,
        createdAt: '2024-01-05T00:00:00.000Z'
      }
    ]
  });
});

/**
 * @swagger
 * /api/company-admin/form-builder:
 *   post:
 *     summary: Create a new form
 *     tags: [Company Admin - Form Builder]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 */
router.post('/', auth, authorize('company_admin', 'super_admin'), (req, res) => {
  const { name, description, fields } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'Form created successfully',
    data: {
      id: Date.now(),
      name,
      description,
      fields,
      submissions: 0,
      createdAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/company-admin/form-builder/{id}:
 *   get:
 *     summary: Get form by ID
 *     tags: [Company Admin - Form Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', auth, authorize('company_admin', 'super_admin'), (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Form retrieved successfully',
    data: {
      id,
      name: 'Contact Form',
      description: 'General contact form for customer inquiries',
      fields: [
        { type: 'text', label: 'Name', required: true },
        { type: 'email', label: 'Email', required: true },
        { type: 'textarea', label: 'Message', required: true }
      ],
      submissions: 45,
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  });
});

/**
 * @swagger
 * /api/company-admin/form-builder/{id}:
 *   put:
 *     summary: Update form
 *     tags: [Company Admin - Form Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', auth, authorize('company_admin', 'super_admin'), (req, res) => {
  const { id } = req.params;
  const { name, description, fields } = req.body;
  
  res.json({
    success: true,
    message: 'Form updated successfully',
    data: {
      id,
      name,
      description,
      fields,
      updatedAt: new Date().toISOString()
    }
  });
});

/**
 * @swagger
 * /api/company-admin/form-builder/{id}:
 *   delete:
 *     summary: Delete form
 *     tags: [Company Admin - Form Builder]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', auth, authorize('company_admin', 'super_admin'), (req, res) => {
  const { id } = req.params;
  
  res.json({
    success: true,
    message: 'Form deleted successfully',
    data: { id }
  });
});

module.exports = router;
