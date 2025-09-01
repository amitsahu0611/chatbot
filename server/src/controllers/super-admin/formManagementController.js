const Form = require('../../models/company-admin/form-builder/Form');
const FormSubmission = require('../../models/company-admin/form-builder/FormSubmission');
const Company = require('../../models/Company');
const { Op } = require('sequelize');
const { logger } = require('../../utils/logger');

// Get all forms across all companies for super admin
const getAllForms = async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      companyId = '',
      isActive = '',
      formType = ''
    } = req.query;

    // Build where clause
    const where = {};
    
    if (companyId) where.companyId = parseInt(companyId);
    if (isActive !== '') where.isActive = isActive === 'true';
    if (formType) where.formType = formType;
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: forms } = await Form.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'email', 'subscriptionPlan'],
          required: true
        }
      ]
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / parseInt(limit));
    const hasNext = parseInt(page) < totalPages;
    const hasPrev = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        forms,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalForms: count,
          hasNext,
          hasPrev,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching forms for super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch forms',
      error: error.message
    });
  }
};

// Get forms for a specific company
const getCompanyForms = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { companyId } = req.params;
    const { includeInactive = false } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Check if company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const where = { companyId: parseInt(companyId) };
    
    // Only show active forms unless specifically requested
    if (!includeInactive || includeInactive === 'false') {
      where.isActive = true;
    }

    const forms = await Form.findAll({
      where,
      order: [['name', 'ASC']],
      attributes: [
        'id', 
        'name', 
        'description', 
        'formType', 
        'isActive', 
        'isPublished',
        'totalSubmissions',
        'createdAt'
      ]
    });

    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          email: company.email
        },
        forms,
        total: forms.length
      }
    });

  } catch (error) {
    logger.error('Error fetching company forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company forms',
      error: error.message
    });
  }
};

// Activate/Deactivate form
const toggleFormStatus = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { formId } = req.params;
    const { isActive } = req.body;

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: 'Form ID is required'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    const form = await Form.findByPk(formId, {
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Update form status
    form.isActive = isActive;
    await form.save();

    // Log the activity
    logger.info(`Super admin ${req.user.email} ${isActive ? 'activated' : 'deactivated'} form "${form.name}" for company "${form.company.name}"`);

    res.json({
      success: true,
      message: `Form ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: form.id,
        name: form.name,
        isActive: form.isActive,
        company: form.company
      }
    });

  } catch (error) {
    logger.error('Error toggling form status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle form status',
      error: error.message
    });
  }
};

// Bulk activate/deactivate forms for a company
const bulkToggleCompanyForms = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    const { companyId } = req.params;
    const { isActive, formIds = [] } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    // Check if company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    let where = { companyId: parseInt(companyId) };
    
    // If specific form IDs provided, update only those
    if (formIds.length > 0) {
      where.id = { [Op.in]: formIds };
    }

    // Update forms
    const [updatedCount] = await Form.update(
      { isActive },
      { where }
    );

    // Get updated forms for response
    const updatedForms = await Form.findAll({
      where,
      attributes: ['id', 'name', 'isActive', 'formType'],
      order: [['name', 'ASC']]
    });

    // Log the activity
    logger.info(`Super admin ${req.user.email} bulk ${isActive ? 'activated' : 'deactivated'} ${updatedCount} forms for company "${company.name}"`);

    res.json({
      success: true,
      message: `${updatedCount} forms ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        company: {
          id: company.id,
          name: company.name
        },
        updatedCount,
        forms: updatedForms
      }
    });

  } catch (error) {
    logger.error('Error bulk toggling forms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk toggle forms',
      error: error.message
    });
  }
};

// Get form statistics for super admin dashboard
const getFormStats = async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }

    // Get total forms count
    const totalForms = await Form.count();
    
    // Get active forms count
    const activeForms = await Form.count({
      where: { isActive: true }
    });
    
    // Get published forms count
    const publishedForms = await Form.count({
      where: { 
        isActive: true, 
        isPublished: true 
      }
    });
    
    // Get total submissions count
    const totalSubmissions = await FormSubmission.count();
    
    // Get recent submissions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubmissions = await FormSubmission.count({
      where: {
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Get forms by type
    const formsByType = await Form.findAll({
      attributes: [
        'formType',
        [Form.sequelize.fn('COUNT', Form.sequelize.col('id')), 'count']
      ],
      group: ['formType'],
      raw: true
    });

    // Get top companies by form count
    const topCompaniesByForms = await Form.findAll({
      attributes: [
        'companyId',
        [Form.sequelize.fn('COUNT', Form.sequelize.col('Form.id')), 'formCount']
      ],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name']
        }
      ],
      group: ['companyId', 'company.id'],
      order: [[Form.sequelize.fn('COUNT', Form.sequelize.col('Form.id')), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalForms,
          activeForms,
          inactiveForms: totalForms - activeForms,
          publishedForms,
          totalSubmissions,
          recentSubmissions
        },
        formsByType: formsByType.reduce((acc, item) => {
          acc[item.formType] = parseInt(item.count);
          return acc;
        }, {}),
        topCompaniesByForms: topCompaniesByForms.map(item => ({
          companyId: item.companyId,
          companyName: item.company.name,
          formCount: parseInt(item.dataValues.formCount)
        }))
      }
    });

  } catch (error) {
    logger.error('Error fetching form stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch form statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllForms,
  getCompanyForms,
  toggleFormStatus,
  bulkToggleCompanyForms,
  getFormStats
};
