const { Op } = require('sequelize');
const Widget = require('../../../models/company-admin/widget-management/Widget');
const { logger } = require('../../../utils/logger');

/**
 * Generate unique widget ID
 */
const generateWidgetId = (companyId, type) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `widget_${companyId}_${type}_${timestamp}_${random}`;
};

/**
 * Generate embed code for widget
 */
const generateEmbedCode = (widgetId, companyId, type, domain) => {
  const baseUrl = process.env.WIDGET_BASE_URL || 'http://localhost:5001';
  const scriptUrl = `${baseUrl}/api/widget/${type}.js`;
  
  return `<script src="${scriptUrl}" data-widget-id="${widgetId}" data-company-id="${companyId}"></script>`;
};

/**
 * Get all widgets for a company
 */
const getWidgets = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { page = 1, limit = 10, status, type } = req.query;
    
    const whereClause = { companyId };
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: widgets } = await Widget.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      message: 'Widgets retrieved successfully',
      data: {
        widgets,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting widgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve widgets',
      error: error.message
    });
  }
};

/**
 * Create a new widget
 */
const createWidget = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { name, type, domain, settings } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }
    
    // Validate widget type
    if (!['chat', 'form'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Widget type must be either "chat" or "form"'
      });
    }
    
    // Generate unique widget ID
    const widgetId = generateWidgetId(companyId, type);
    
    // Generate embed code
    const embedCode = generateEmbedCode(widgetId, companyId, type, domain);
    
    // Create widget
    const widget = await Widget.create({
      companyId,
      name,
      type,
      status: 'active',
      domain,
      widgetId,
      settings: settings || {},
      stats: {
        totalInteractions: 0,
        uniqueVisitors: 0,
        conversionRate: 0,
        totalSubmissions: 0
      },
      embedCode
    });
    
    res.status(201).json({
      success: true,
      message: 'Widget created successfully',
      data: widget
    });
  } catch (error) {
    logger.error('Error creating widget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create widget',
      error: error.message
    });
  }
};

/**
 * Get widget by ID
 */
const getWidgetById = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    
    const widget = await Widget.findOne({
      where: {
        id,
        companyId
      }
    });
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Widget retrieved successfully',
      data: widget
    });
  } catch (error) {
    logger.error('Error getting widget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve widget',
      error: error.message
    });
  }
};

/**
 * Update widget
 */
const updateWidget = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { name, settings, status, domain } = req.body;
    
    const widget = await Widget.findOne({
      where: {
        id,
        companyId
      }
    });
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }
    
    // Update fields
    if (name) widget.name = name;
    if (settings) widget.settings = { ...widget.settings, ...settings };
    if (status) widget.status = status;
    if (domain) widget.domain = domain;
    
    // Regenerate embed code if domain changed
    if (domain) {
      widget.embedCode = generateEmbedCode(widget.widgetId, companyId, widget.type, domain);
    }
    
    await widget.save();
    
    res.json({
      success: true,
      message: 'Widget updated successfully',
      data: widget
    });
  } catch (error) {
    logger.error('Error updating widget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update widget',
      error: error.message
    });
  }
};

/**
 * Delete widget
 */
const deleteWidget = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    
    const widget = await Widget.findOne({
      where: {
        id,
        companyId
      }
    });
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }
    
    await widget.destroy();
    
    res.json({
      success: true,
      message: 'Widget deleted successfully',
      data: { id }
    });
  } catch (error) {
    logger.error('Error deleting widget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete widget',
      error: error.message
    });
  }
};

/**
 * Get widget statistics
 */
const getWidgetStats = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { period = '30d' } = req.query;
    
    const widget = await Widget.findOne({
      where: {
        id,
        companyId
      }
    });
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }
    
    // TODO: Implement real statistics calculation
    // For now, return mock data
    const mockStats = {
      widgetId: id,
      period,
      overview: {
        totalInteractions: widget.stats.totalInteractions || 0,
        uniqueVisitors: widget.stats.uniqueVisitors || 0,
        conversionRate: widget.stats.conversionRate || 0,
        averageResponseTime: 2.3
      },
      dailyStats: [
        { date: '2024-01-01', interactions: 45, visitors: 32, conversions: 6 },
        { date: '2024-01-02', interactions: 52, visitors: 38, conversions: 8 },
        { date: '2024-01-03', interactions: 38, visitors: 25, conversions: 4 },
        { date: '2024-01-04', interactions: 67, visitors: 45, conversions: 9 },
        { date: '2024-01-05', interactions: 89, visitors: 62, conversions: 12 }
      ],
      topQuestions: [
        { question: 'How do I reset my password?', count: 45 },
        { question: 'What are your business hours?', count: 32 },
        { question: 'How can I contact support?', count: 28 }
      ]
    };
    
    res.json({
      success: true,
      message: 'Widget statistics retrieved successfully',
      data: mockStats
    });
  } catch (error) {
    logger.error('Error getting widget stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve widget statistics',
      error: error.message
    });
  }
};

/**
 * Get widget embed code
 */
const getWidgetEmbedCode = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    
    const widget = await Widget.findOne({
      where: {
        id,
        companyId
      }
    });
    
    if (!widget) {
      return res.status(404).json({
        success: false,
        message: 'Widget not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Embed code retrieved successfully',
      data: {
        widgetId: widget.widgetId,
        embedCode: widget.embedCode,
        installationInstructions: [
          'Copy the embed code above',
          'Paste it into your website\'s HTML, preferably before the closing </body> tag',
          'The widget will automatically appear on your website',
          'Make sure your domain is allowed in the widget settings'
        ]
      }
    });
  } catch (error) {
    logger.error('Error getting widget embed code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve embed code',
      error: error.message
    });
  }
};

module.exports = {
  getWidgets,
  createWidget,
  getWidgetById,
  updateWidget,
  deleteWidget,
  getWidgetStats,
  getWidgetEmbedCode
};
