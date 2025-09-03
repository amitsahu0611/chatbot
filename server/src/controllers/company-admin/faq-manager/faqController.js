const { FAQ, User } = require('../../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/database');
const logger = require('../../../utils/logger');

// Get all FAQs with filtering and pagination
const getFAQs = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      isActive = '',
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const where = { companyId };
    
    if (category) where.category = category;
    if (isActive !== '') where.isActive = isActive === 'true';
    
    if (search) {
      where[Op.or] = [
        { question: { [Op.like]: `%${search}%` } },
        { answer: { [Op.like]: `%${search}%` } }
      ];
    }

    // Build sort array
    const order = [[sortBy, sortOrder.toUpperCase()]];

    // Optimize query: Only include user info if specifically requested
    const includeUsers = req.query.includeUsers === 'true';
    
    // Set reasonable limits to prevent huge queries
    const maxLimit = 100;
    const actualLimit = Math.min(parseInt(limit), maxLimit);
    
    const queryOptions = {
      where,
      order,
      limit: actualLimit,
      offset: (parseInt(page) - 1) * actualLimit,
      attributes: [
        'id', 'question', 'answer', 'category', 'tags', 'isActive', 
        'views', 'helpfulCount', 'notHelpfulCount', 'order', 'createdAt', 'updatedAt'
      ]
    };

    // Only add expensive includes when needed
    if (includeUsers) {
      queryOptions.include = [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ];
    }

    const { count, rows: faqs } = await FAQ.findAndCountAll(queryOptions);

    res.json({
      success: true,
      data: {
        faqs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalFAQs: count,
          hasNextPage: page * limit < count,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs'
    });
  }
};

// Get FAQ by ID
const getFAQById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { id } = req.params;
    
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }

    const faq = await FAQ.findOne({
      where: { id, companyId },
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        },
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    res.json({
      success: true,
      data: faq
    });
  } catch (error) {
    logger.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ'
    });
  }
};

// Create new FAQ
const createFAQ = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }
    
    const { userId } = req.user;
    const { question, answer, category, tags = [], searchKeywords = [], order = 0, isActive = true } = req.body;

    // Validate required fields
    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        message: 'Question, answer, and category are required'
      });
    }

    const faq = await FAQ.create({
      companyId,
      question,
      answer,
      category,
      tags,
      searchKeywords,
      order,
      isActive,
      createdBy: userId
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });
  } catch (error) {
    logger.error('Error creating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create FAQ'
    });
  }
};

// Update FAQ
const updateFAQ = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { id } = req.params;
    
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }
    
    const { userId } = req.user;
    const updateData = req.body;

    const faq = await FAQ.findOne({ where: { id, companyId } });
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'companyId' && key !== 'id') {
        faq[key] = updateData[key];
      }
    });

    faq.updatedBy = userId;

    await faq.save();

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    logger.error('Error updating FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQ'
    });
  }
};

// Delete FAQ
const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }

    const faq = await FAQ.findOne({ where: { id, companyId } });
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }

    await faq.destroy();

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete FAQ'
    });
  }
};

// Get FAQ categories
const getCategories = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }

    const categories = await FAQ.findAll({
      where: { companyId },
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isActive = 1 THEN 1 ELSE 0 END')), 'activeCount']
      ],
      group: ['category'],
      order: [['category', 'ASC']],
      raw: true
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: parseInt(cat.count),
      activeCount: parseInt(cat.activeCount)
    }));

    res.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    logger.error('Error fetching FAQ categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ categories'
    });
  }
};

// Bulk update FAQs
const bulkUpdateFAQs = async (req, res) => {
  try {
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }
    
    const { faqIds, updates } = req.body;

    if (!faqIds || !Array.isArray(faqIds) || faqIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'FAQ IDs are required'
      });
    }

    const result = await FAQ.update(updates, {
      where: {
        id: { [Op.in]: faqIds },
        companyId
      }
    });

    res.json({
      success: true,
      message: `${result[0]} FAQs updated successfully`,
      data: { modifiedCount: result[0] }
    });
  } catch (error) {
    logger.error('Error bulk updating FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update FAQs'
    });
  }
};

// Reorder FAQs
const reorderFAQs = async (req, res) => {
  try {
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }
    
    const { faqOrders } = req.body; // Array of { id, order }

    if (!faqOrders || !Array.isArray(faqOrders)) {
      return res.status(400).json({
        success: false,
        message: 'FAQ orders are required'
      });
    }

    let modifiedCount = 0;
    for (const { id, order } of faqOrders) {
      const result = await FAQ.update(
        { order },
        { where: { id, companyId } }
      );
      modifiedCount += result[0];
    }

    res.json({
      success: true,
      message: 'FAQs reordered successfully',
      data: { modifiedCount }
    });
  } catch (error) {
    logger.error('Error reordering FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder FAQs'
    });
  }
};

// Get FAQ statistics
const getFAQStats = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }

    const stats = await FAQ.findOne({
      where: { companyId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isActive = 1 THEN 1 ELSE 0 END')), 'active'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN isActive = 0 THEN 1 ELSE 0 END')), 'inactive'],
        [sequelize.fn('SUM', sequelize.col('views')), 'totalViews'],
        [sequelize.fn('SUM', sequelize.col('helpfulCount')), 'totalHelpful'],
        [sequelize.fn('SUM', sequelize.col('notHelpfulCount')), 'totalNotHelpful'],
        [sequelize.fn('AVG', sequelize.col('views')), 'avgViews']
      ],
      raw: true
    });

    const categoryStats = await FAQ.findAll({
      where: { companyId },
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('views')), 'views'],
        [sequelize.fn('SUM', sequelize.col('helpfulCount')), 'helpful']
      ],
      group: ['category'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 5,
      raw: true
    });

    const result = {
      overview: {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0,
        totalViews: parseInt(stats.totalViews) || 0,
        totalHelpful: parseInt(stats.totalHelpful) || 0,
        totalNotHelpful: parseInt(stats.totalNotHelpful) || 0,
        avgViews: parseFloat(stats.avgViews) || 0
      },
      topCategories: categoryStats.map(cat => ({
        name: cat.category,
        count: parseInt(cat.count),
        views: parseInt(cat.views) || 0,
        helpful: parseInt(cat.helpful) || 0
      }))
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching FAQ stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ statistics'
    });
  }
};

// Search FAQs
const searchFAQs = async (req, res) => {
  try {
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      // Super admin can specify which company to view
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }
    
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const faqs = await FAQ.findAll({
      where: {
        companyId,
        isActive: true,
        [Op.or]: [
          { question: { [Op.like]: `%${q}%` } },
          { answer: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: parseInt(limit),
      order: [['order', 'ASC']]
    });

    res.json({
      success: true,
      data: faqs
    });
  } catch (error) {
    logger.error('Error searching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search FAQs'
    });
  }
};

module.exports = {
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
};
