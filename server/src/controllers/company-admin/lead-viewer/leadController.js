const { Lead, User } = require('../../../models');
const ChatMessage = require('../../../models/widget/ChatMessage');
const VisitorSession = require('../../../models/widget/VisitorSession');
const { Op } = require('sequelize');
const { sequelize } = require('../../../config/database');
const logger = require('../../../utils/logger');

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

    // Optimize query performance
    const includeAssignedUser = req.query.includeUser === 'true';
    const maxLimit = 100;
    const actualLimit = Math.min(parseInt(limit), maxLimit);
    
    const queryOptions = {
      where,
      order,
      limit: actualLimit,
      offset: (parseInt(page) - 1) * actualLimit,
      attributes: [
        'id', 'companyId', 'visitorId', 'name', 'email', 'phone', 
        'status', 'priority', 'source', 'score', 'assignedTo',
        'createdAt', 'updatedAt', 'lastActivity', 'tags'
      ]
    };

    // Only include user data when specifically requested
    if (includeAssignedUser) {
      queryOptions.include = [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ];
    }

    const { count, rows: leads } = await Lead.findAndCountAll(queryOptions);

    // Get statistics - only if explicitly requested to avoid slow queries
    let stats = null;
    const includeStats = req.query.includeStats === 'true';
    
    if (includeStats) {
      try {
        const statsWhere = role !== 'super_admin' || !allCompanies ? { companyId: targetCompanyId } : {};
        
        // Use more efficient query with proper indexing
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

    logger.info(`Lead created successfully with ID: ${lead.id} for company ${userCompanyId}`);

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

    logger.info(`Lead updated successfully with ID: ${id} for company ${companyId}`);

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

    logger.info(`Lead deleted successfully with ID: ${id} for company ${companyId}`);

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

// Export leads to CSV
const exportLeads = async (req, res) => {
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
      search = '', 
      source = '', 
      status = '', 
      priority = '',
      allCompanies = false,
      companyId: queryCompanyId,
      format = 'csv'
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

    // Get all leads for export (no pagination)
    const leads = await Lead.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'companyId', 'visitorId', 'name', 'email', 'phone', 
        'status', 'priority', 'source', 'score', 'notes', 'tags',
        'createdAt', 'updatedAt', 'lastActivity', 'ipAddress',
        'referrer', 'userAgent', 'visitCount', 'totalTimeOnSite'
      ],
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'firstName', 'lastName'],
          required: false
        }
      ]
    });

    if (format === 'json') {
      // Return JSON format
      return res.json({
        success: true,
        data: {
          leads,
          count: leads.length,
          exportedAt: new Date().toISOString(),
          filters: { search, source, status, priority }
        }
      });
    }

    // Generate CSV format
    const csvRows = [];
    
    // CSV Headers
    csvRows.push([
      'ID',
      'Company ID',
      'Visitor ID',
      'Name',
      'Email',
      'Phone',
      'Status',
      'Priority',
      'Source',
      'Score',
      'Assigned To',
      'Tags',
      'Notes',
      'Created At',
      'Last Activity',
      'IP Address',
      'Referrer',
      'Visit Count',
      'Time on Site (seconds)'
    ]);

    // CSV Data
    leads.forEach(lead => {
      csvRows.push([
        lead.id,
        lead.companyId,
        lead.visitorId || '',
        lead.name || '',
        lead.email || '',
        lead.phone || '',
        lead.status,
        lead.priority,
        lead.source || '',
        lead.score,
        lead.assignedUser ? `${lead.assignedUser.firstName} ${lead.assignedUser.lastName}` : '',
        Array.isArray(lead.tags) ? lead.tags.join('; ') : '',
        lead.notes || '',
        lead.createdAt ? new Date(lead.createdAt).toISOString() : '',
        lead.lastActivity ? new Date(lead.lastActivity).toISOString() : '',
        lead.ipAddress || '',
        lead.referrer || '',
        lead.visitCount || 0,
        lead.totalTimeOnSite || 0
      ]);
    });

    // Convert to CSV string
    const csvContent = csvRows.map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringField = String(field || '');
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',')
    ).join('\n');

    // Set headers for CSV download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `leads_export_${timestamp}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    res.send(csvContent);

  } catch (error) {
    logger.error('Error exporting leads:', error.message || error);
    res.status(500).json({
      success: false,
      message: 'Failed to export leads',
      error: error.message
    });
  }
};

// Get chat history for a lead
const getLeadChatHistory = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    const { id: leadId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const { companyId, role } = req.user;

    // Get the lead first to ensure it belongs to this company
    const leadWhere = { id: leadId };
    if (role !== 'super_admin') {
      leadWhere.companyId = companyId;
    }
    
    const lead = await Lead.findOne({
      where: leadWhere
    });

    if (!lead) {
      logger.warn('Lead not found for chat history request', { leadId, companyId, role });
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    logger.info('Found lead for chat history', { 
      leadId: lead.id, 
      leadEmail: lead.email, 
      leadVisitorId: lead.visitorId,
      leadIpAddress: lead.ipAddress 
    });

    if (!lead.visitorId) {
      return res.json({
        success: true,
        data: {
          messages: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalMessages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Strategy: Use multiple approaches to find chat messages for this lead
    // 1. Direct sessionId match (if lead has sessionId)
    // 2. IP address match
    // 3. Email match through visitor sessions
    
    let allMessages = [];
    let sessionInfo = new Map();

    // Method 1: Direct sessionId match
    if (lead.sessionId) {
      logger.info('Searching by direct sessionId', { sessionId: lead.sessionId });
      const directMessages = await ChatMessage.findAll({
        where: {
          companyId: lead.companyId,
          sessionId: lead.sessionId
        },
        attributes: [
          'id',
          'messageType', 
          'content',
          'timestamp',
          'sessionId',
          'metadata'
        ]
      });
      allMessages = allMessages.concat(directMessages);
      logger.info('Found messages by direct sessionId', { count: directMessages.length });
    }

    // Method 2: IP address match
    if (lead.ipAddress) {
      logger.info('Searching by IP address', { ipAddress: lead.ipAddress });
      const ipMessages = await ChatMessage.findAll({
        where: {
          companyId: lead.companyId,
          ipAddress: lead.ipAddress
        },
        attributes: [
          'id',
          'messageType',
          'content', 
          'timestamp',
          'sessionId',
          'metadata'
        ]
      });
      
      // Add only unique messages (avoid duplicates from method 1)
      const existingIds = new Set(allMessages.map(m => m.id));
      const uniqueIpMessages = ipMessages.filter(m => !existingIds.has(m.id));
      allMessages = allMessages.concat(uniqueIpMessages);
      logger.info('Found additional messages by IP', { count: uniqueIpMessages.length });
    }

    // Method 3: Visitor session match by email
    if (lead.email && allMessages.length === 0) {
      logger.info('Searching by email through visitor sessions', { email: lead.email });
      const visitorSessions = await VisitorSession.findAll({
        where: {
          companyId: lead.companyId,
          visitorEmail: lead.email
        },
        attributes: ['sessionToken', 'visitorName', 'visitorEmail', 'createdAt']
      });

      if (visitorSessions.length > 0) {
        const sessionTokens = visitorSessions.map(session => session.sessionToken);
        logger.info('Found visitor sessions by email', { count: visitorSessions.length, tokens: sessionTokens });

        // Store session info for later use
        visitorSessions.forEach(session => {
          sessionInfo.set(session.sessionToken, {
            visitorName: session.visitorName,
            visitorEmail: session.visitorEmail,
            sessionDate: session.createdAt
          });
        });

        const sessionMessages = await ChatMessage.findAll({
          where: {
            companyId: lead.companyId,
            sessionId: {
              [Op.in]: sessionTokens
            }
          },
          attributes: [
            'id',
            'messageType',
            'content',
            'timestamp', 
            'sessionId',
            'metadata'
          ]
        });
        allMessages = allMessages.concat(sessionMessages);
        logger.info('Found messages by visitor session tokens', { count: sessionMessages.length });
      }
    }

    // Remove duplicates and sort by timestamp (newest first)
    const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    logger.info('Total unique messages found', { count: uniqueMessages.length });

    // If no messages found, return empty result
    if (uniqueMessages.length === 0) {
      return res.json({
        success: true,
        data: {
          messages: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalMessages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      });
    }

    // Apply pagination to the unique messages
    const totalMessages = uniqueMessages.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const totalPages = Math.ceil(totalMessages / parseInt(limit));
    const paginatedMessages = uniqueMessages.slice(offset, offset + parseInt(limit));

    // Add session info to messages
    const messagesWithSessions = paginatedMessages.map(message => {
      const session = sessionInfo.get(message.sessionId);
      return {
        ...message.toJSON(),
        session: session || {
          visitorName: 'Unknown',
          visitorEmail: lead.email || 'Unknown',
          sessionDate: message.timestamp
        }
      };
    });

    res.json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          visitorId: lead.visitorId
        },
        messages: messagesWithSessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalMessages,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error getting lead chat history:', {
      error: error.message || error,
      stack: error.stack,
      leadId: leadId,
      userId: req.user?.id,
      companyId: req.user?.companyId
    });
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message
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
  searchLeads,
  exportLeads,
  getLeadChatHistory
};
