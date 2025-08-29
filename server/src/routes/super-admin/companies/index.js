const express = require('express');
const router = express.Router();
const Company = require('../../../models/Company');
const { auth } = require('../../../middleware/auth');
const logger = require('../../../utils/logger');

/**
 * @swagger
 * /api/super-admin/companies:
 *   get:
 *     summary: Get all companies (Super Admin only)
 *     tags: [Super Admin - Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a super admin
 */
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    // Get all companies with pagination
    const { page = 1, limit = 50, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    
    // Add search functionality
    if (search) {
      whereClause = {
        [require('sequelize').Op.or]: [
          { name: { [require('sequelize').Op.like]: `%${search}%` } },
          { email: { [require('sequelize').Op.like]: `%${search}%` } },
          { domain: { [require('sequelize').Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      attributes: [
        'id', 'name', 'domain', 'email', 'phone', 'address',
        'subscriptionPlan', 'subscriptionStatus', 'subscriptionExpiresAt',
        'maxUsers', 'maxConversations', 'isActive', 'createdAt', 'updatedAt'
      ]
    });

    logger.info(`Super admin ${req.user.email} retrieved ${companies.length} companies`);

    res.json({
      success: true,
      message: 'Companies retrieved successfully',
      data: companies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalCompanies: count,
        hasMore: offset + companies.length < count
      }
    });

  } catch (error) {
    logger.error('Error retrieving companies:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving companies'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/companies:
 *   post:
 *     summary: Create a new company (Super Admin only)
 *     tags: [Super Admin - Companies]
 *     security:
 *       - bearerAuth: []
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
 *               domain:
 *                 type: string
 *               subscriptionPlan:
 *                 type: string
 *                 enum: [free, basic, premium, enterprise]
 */
router.post('/', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { name, email, phone, domain, subscriptionPlan = 'free' } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Company name and email are required'
      });
    }

    // Check if company with same email already exists
    const existingCompany = await Company.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'A company with this email already exists'
      });
    }

    // Create new company
    const company = await Company.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : null,
      domain: domain ? domain.trim() : null,
      subscriptionPlan,
      isActive: true
    });

    logger.info(`Super admin ${req.user.email} created company: ${company.name} (ID: ${company.id})`);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company
    });

  } catch (error) {
    logger.error('Error creating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating company'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/companies/{id}:
 *   get:
 *     summary: Get company by ID (Super Admin only)
 *     tags: [Super Admin - Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { id } = req.params;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company retrieved successfully',
      data: company
    });

  } catch (error) {
    logger.error('Error retrieving company:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving company'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/companies/{id}:
 *   put:
 *     summary: Update company (Super Admin only)
 *     tags: [Super Admin - Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Update company
    await company.update(updateData);

    logger.info(`Super admin ${req.user.email} updated company: ${company.name} (ID: ${company.id})`);

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });

  } catch (error) {
    logger.error('Error updating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating company'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/companies/{id}:
 *   delete:
 *     summary: Delete company (Super Admin only)
 *     tags: [Super Admin - Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { id } = req.params;

    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Soft delete by setting isActive to false
    await company.update({ isActive: false });

    logger.info(`Super admin ${req.user.email} deactivated company: ${company.name} (ID: ${company.id})`);

    res.json({
      success: true,
      message: 'Company deactivated successfully'
    });

  } catch (error) {
    logger.error('Error deactivating company:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating company'
    });
  }
});

module.exports = router;
