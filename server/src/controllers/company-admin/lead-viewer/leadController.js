const { Lead, User } = require('../../../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/database');
const { logger } = require('../../../utils/logger');

// Get all leads with filtering and pagination
const getLeads = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { companyId: userCompanyId, role } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      source = '', 
      status = '', 
      priority = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      allCompanies = false, // New parameter for super admin
      companyId: queryCompanyId // Company ID from query parameter
    } = req.query;

    // Determine which company ID to use
    let targetCompanyId = userCompanyId;
    
    // For super admin, use query companyId if provided
    if (role === 'super_admin' && queryCompanyId) {
      targetCompanyId = parseInt(queryCompanyId);
    }

    // Build query - Super admin can see all companies if allCompanies=true
    const where = {};
    
    // Only filter by company if not super admin or if allCompanies is not requested
    if (role !== 'super_admin' || !allCompanies) {
      where.companyId = targetCompanyId;
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (source) where.source = source;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Build sort array
    const order = [[sortBy, sortOrder.toUpperCase()]];

    const { count, rows: leads } = await Lead.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    // Get statistics with better error handling
    let stats = null;
    try {
      const statsWhere = role !== 'super_admin' || !allCompanies ? { companyId: targetCompanyId } : {};
      stats = await Lead.findOne({
        where: statsWhere,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "new" THEN 1 ELSE 0 END')), 'new'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "contacted" THEN 1 ELSE 0 END')), 'contacted'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "qualified" THEN 1 ELSE 0 END')), 'qualified'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "converted" THEN 1 ELSE 0 END')), 'converted'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "lost" THEN 1 ELSE 0 END')), 'lost']
        ],
        raw: true
      });
    } catch (statsError) {
      console.error('Error fetching lead statistics:', statsError);
      logger.error('Error fetching lead statistics:', String(statsError));
      stats = null;
    }

    // Ensure stats object exists and has default values
    const safeStats = stats || {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0
    };

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalLeads: count,
          hasNextPage: page * limit < count,
          hasPrevPage: page > 1
        },
        stats: {
          total: parseInt(safeStats.total) || 0,
          new: parseInt(safeStats.new) || 0,
          contacted: parseInt(safeStats.contacted) || 0,
          qualified: parseInt(safeStats.qualified) || 0,
          converted: parseInt(safeStats.converted) || 0,
          lost: parseInt(safeStats.lost) || 0
        },
        // Add info about current view
        viewInfo: {
          companyId: role !== 'super_admin' || !allCompanies ? targetCompanyId : 'all',
          role: role,
          allCompanies: role === 'super_admin' && allCompanies
        }
      }
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    logger.error('Error fetching leads:', String(error));
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads'
    });
  }
};

// Get lead by ID
const getLeadById = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { id } = req.params;
    const { companyId } = req.user;

    const lead = await Lead.findOne({
      where: { id, companyId },
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    logger.error('Error fetching lead:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead'
    });
  }
};

// Create new lead
const createLead = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { companyId: userCompanyId, userId } = req.user;
    const leadData = req.body;

    // Validate required fields
    if (!leadData.name && !leadData.email) {
      return res.status(400).json({
        success: false,
        message: 'Name or email is required'
      });
    }

    // Validate email format if provided
    if (leadData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Use companyId from request body if provided, otherwise use user's companyId
    const finalCompanyId = leadData.companyId || userCompanyId;

    // Generate visitor ID if not provided (for manually created leads)
    if (!leadData.visitorId) {
      leadData.visitorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Set default values for required fields
    const lead = await Lead.create({
      ...leadData,
      companyId: finalCompanyId,
      status: leadData.status || 'new',
      priority: leadData.priority || 'medium',
      source: leadData.source || 'manual',
      firstVisit: leadData.firstVisit || new Date(),
      lastVisit: leadData.lastVisit || new Date(),
      visitCount: leadData.visitCount || 1,
      interactions: leadData.interactions || [],
      customFields: leadData.customFields || {},
      tags: leadData.tags || [],
      pagesViewed: leadData.pagesViewed || 0,
      formsSubmitted: leadData.formsSubmitted || 0,
      emailsOpened: leadData.emailsOpened || 0,
      emailsClicked: leadData.emailsClicked || 0,
      hasChatted: leadData.hasChatted || false,
      chatCount: leadData.chatCount || 0,
      socialProfiles: leadData.socialProfiles || {},
      preferences: leadData.preferences || {
        emailOptIn: false,
        smsOptIn: false,
        marketingOptIn: false,
        preferredContactMethod: 'email',
        preferredContactTime: 'business_hours'
      },
      gdprConsent: leadData.gdprConsent || false,
      metadata: leadData.metadata || {}
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead
    });
  } catch (error) {
    logger.error('Error creating lead:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead'
    });
  }
};

// Update lead
const updateLead = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { id } = req.params;
    const { companyId, userId } = req.user;
    const updateData = req.body;

    const lead = await Lead.findOne({ where: { id, companyId } });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'companyId' && key !== 'id') {
        lead[key] = updateData[key];
      }
    });

    await lead.save();

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    logger.error('Error updating lead:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead'
    });
  }
};

// Delete lead
const deleteLead = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { id } = req.params;
    const { companyId } = req.user;

    const lead = await Lead.findOne({ where: { id, companyId } });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await lead.destroy();

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting lead:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead'
    });
  }
};

// Bulk update leads
const bulkUpdateLeads = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { companyId } = req.user;
    const { leadIds, updates } = req.body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lead IDs are required'
      });
    }

    const result = await Lead.update(updates, {
      where: {
        id: { [Op.in]: leadIds },
        companyId
      }
    });

    res.json({
      success: true,
      message: `${result[0]} leads updated successfully`,
      data: { modifiedCount: result[0] }
    });
  } catch (error) {
    logger.error('Error bulk updating leads:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to update leads'
    });
  }
};

// Get lead statistics
const getLeadStats = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { companyId: userCompanyId, role } = req.user;
    const { allCompanies = false, companyId: queryCompanyId } = req.query;

    // Determine which company ID to use
    let targetCompanyId = userCompanyId;
    
    // For super admin, use query companyId if provided
    if (role === 'super_admin' && queryCompanyId) {
      targetCompanyId = parseInt(queryCompanyId);
    }

    // Get statistics with better error handling
    let stats = null;
    let sourceStats = [];
    
    // Build where clause - Super admin can see all companies if allCompanies=true
    const statsWhere = {};
    if (role !== 'super_admin' || !allCompanies) {
      statsWhere.companyId = targetCompanyId;
    }
    
    try {
      stats = await Lead.findOne({
        where: statsWhere,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "new" THEN 1 ELSE 0 END')), 'new'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "contacted" THEN 1 ELSE 0 END')), 'contacted'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "qualified" THEN 1 ELSE 0 END')), 'qualified'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "converted" THEN 1 ELSE 0 END')), 'converted'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "lost" THEN 1 ELSE 0 END')), 'lost'],
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore'],
          [sequelize.fn('SUM', sequelize.col('conversionValue')), 'totalValue']
        ],
        raw: true
      });
    } catch (statsError) {
      console.error('Error fetching lead statistics:', statsError);
      logger.error('Error fetching lead statistics:', String(statsError));
      stats = null;
    }

    try {
      sourceStats = await Lead.findAll({
        where: statsWhere,
        attributes: [
          'source',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "converted" THEN 1 ELSE 0 END')), 'converted']
        ],
        group: ['source'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });
    } catch (sourceStatsError) {
      console.error('Error fetching source statistics:', sourceStatsError);
      logger.error('Error fetching source statistics:', String(sourceStatsError));
      sourceStats = [];
    }

    // Ensure stats object exists and has default values
    const safeStats = stats || {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
      avgScore: 0,
      totalValue: 0
    };

    const result = {
      overview: {
        total: parseInt(safeStats.total) || 0,
        new: parseInt(safeStats.new) || 0,
        contacted: parseInt(safeStats.contacted) || 0,
        qualified: parseInt(safeStats.qualified) || 0,
        converted: parseInt(safeStats.converted) || 0,
        lost: parseInt(safeStats.lost) || 0,
        avgScore: parseFloat(safeStats.avgScore) || 0,
        totalValue: parseFloat(safeStats.totalValue) || 0
      },
      topSources: sourceStats.map(source => ({
        name: source.source,
        count: parseInt(source.count),
        converted: parseInt(source.converted) || 0
      }))
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    logger.error('Error fetching lead stats:', String(error));
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead statistics'
    });
  }
};

// Search leads
const searchLeads = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { companyId } = req.user;
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const leads = await Lead.findAll({
      where: {
        companyId,
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } },
          { phone: { [Op.like]: `%${q}%` } },
          { notes: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    logger.error('Error searching leads:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to search leads'
    });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  bulkUpdateLeads,
  getLeadStats,
  searchLeads
};
