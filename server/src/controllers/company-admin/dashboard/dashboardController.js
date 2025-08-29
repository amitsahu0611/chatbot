const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../../../config/database');
const Lead = require('../../../models/company-admin/lead-viewer/Lead');
const FAQ = require('../../../models/company-admin/faq-manager/FAQ');
const Form = require('../../../models/company-admin/form-builder/Form');
const UnansweredQuery = require('../../../models/company-admin/faq-manager/UnansweredQuery');
const ChatMessage = require('../../../models/widget/ChatMessage');
const logger = require('../../../utils/logger');

/**
 * Get dashboard statistics for a company
 */
const getDashboardStats = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`📊 Getting dashboard stats for company ${companyId}`);

    // Get current date ranges
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastTwoWeeks = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalLeads,
      totalForms,
      totalFAQs,
      totalConversations,
      recentLeads,
      leadsLastWeek,
      leadsThisWeek,
      conversationsLastWeek,
      conversationsThisWeek,
      faqsLastWeek,
      faqsThisWeek,
      formsLastWeek,
      formsThisWeek,
      unansweredQueries,
      leadSources,
      weeklyActivity
    ] = await Promise.all([
      // Total counts
      Lead.count({ where: { companyId: parseInt(companyId) } }),
      Form.count({ where: { companyId: parseInt(companyId), isActive: true } }),
      FAQ.count({ where: { companyId: parseInt(companyId), isActive: true } }),
      ChatMessage.count({ where: { companyId: parseInt(companyId) } }),
      
      // Recent leads (last 5)
      Lead.findAll({
        where: { companyId: parseInt(companyId) },
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'name', 'email', 'phone', 'source', 'status', 'createdAt']
      }),

      // Growth calculations - Leads
      Lead.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.between]: [lastTwoWeeks, lastWeek] }
        }
      }),
      Lead.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.gte]: lastWeek }
        }
      }),

      // Growth calculations - Conversations
      ChatMessage.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.between]: [lastTwoWeeks, lastWeek] }
        }
      }),
      ChatMessage.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.gte]: lastWeek }
        }
      }),

      // Growth calculations - FAQs
      FAQ.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.between]: [lastTwoWeeks, lastWeek] }
        }
      }),
      FAQ.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.gte]: lastWeek }
        }
      }),

      // Growth calculations - Forms
      Form.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.between]: [lastTwoWeeks, lastWeek] }
        }
      }),
      Form.count({
        where: {
          companyId: parseInt(companyId),
          createdAt: { [Op.gte]: lastWeek }
        }
      }),

      // Unanswered queries count
      UnansweredQuery.count({
        where: { companyId: parseInt(companyId), status: 'pending' }
      }),

      // Lead sources distribution
      Lead.findAll({
        where: { companyId: parseInt(companyId) },
        attributes: [
          'source',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['source'],
        raw: true
      }),

      // Weekly activity for the last 7 days
      sequelize.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN table_name = 'leads' THEN 1 END) as leads,
          COUNT(CASE WHEN table_name = 'chat_messages' THEN 1 END) as conversations
        FROM (
          SELECT createdAt as created_at, 'leads' as table_name FROM leads WHERE companyId = :companyId AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          UNION ALL
          SELECT created_at, 'chat_messages' as table_name FROM chat_messages WHERE company_id = :companyId AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ) combined
        GROUP BY DATE(created_at)
        ORDER BY date
      `, {
        replacements: { companyId: parseInt(companyId) },
        type: sequelize.QueryTypes.SELECT
      })
    ]);

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number(((current - previous) / previous * 100).toFixed(1));
    };

    const stats = {
      totalLeads,
      totalForms,
      totalFAQs,
      totalConversations,
      unansweredQueries,
      leadsGrowth: calculateGrowth(leadsThisWeek, leadsLastWeek),
      formsGrowth: calculateGrowth(formsThisWeek, formsLastWeek),
      faqsGrowth: calculateGrowth(faqsThisWeek, faqsLastWeek),
      conversationsGrowth: calculateGrowth(conversationsThisWeek, conversationsLastWeek)
    };

    // Format recent leads
    const formattedRecentLeads = recentLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      timestamp: lead.createdAt
    }));

    // Format lead sources for chart
    const leadSourcesData = leadSources.reduce((acc, source) => {
      acc[source.source] = parseInt(source.count);
      return acc;
    }, {});

    // Format weekly activity data
    const weeklyData = weeklyActivity.reduce((acc, day) => {
      const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
      acc.labels.push(dayName);
      acc.leads.push(parseInt(day.leads || 0));
      acc.conversations.push(parseInt(day.conversations || 0));
      return acc;
    }, { labels: [], leads: [], conversations: [] });

    // Ensure we have 7 days of data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    // Fill missing days with zeros
    const fullWeeklyData = {
      labels: last7Days,
      leads: last7Days.map(day => {
        const index = weeklyData.labels.indexOf(day);
        return index !== -1 ? weeklyData.leads[index] : 0;
      }),
      conversations: last7Days.map(day => {
        const index = weeklyData.labels.indexOf(day);
        return index !== -1 ? weeklyData.conversations[index] : 0;
      })
    };

    res.json({
      success: true,
      data: {
        stats,
        recentLeads: formattedRecentLeads,
        leadSources: leadSourcesData,
        weeklyActivity: fullWeeklyData
      }
    });

  } catch (error) {
    logger.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard statistics'
    });
  }
};

/**
 * Get recent activity for the company
 */
const getRecentActivity = async (req, res) => {
  try {
    const { companyId, limit = 10 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`📋 Getting recent activity for company ${companyId}`);

    // Get recent activities from different sources
    const [recentLeads, recentFAQs, recentQueries] = await Promise.all([
      Lead.findAll({
        where: { companyId: parseInt(companyId) },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit) / 3,
        attributes: ['id', 'name', 'email', 'source', 'createdAt']
      }),
      FAQ.findAll({
        where: { companyId: parseInt(companyId) },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit) / 3,
        attributes: ['id', 'question', 'category', 'createdAt']
      }),
      UnansweredQuery.findAll({
        where: { companyId: parseInt(companyId) },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit) / 3,
        attributes: ['id', 'query', 'status', 'createdAt']
      })
    ]);

    // Combine and format activities
    const activities = [
      ...recentLeads.map(lead => ({
        id: `lead-${lead.id}`,
        type: 'lead',
        title: `New lead: ${lead.name}`,
        description: `From ${lead.source}`,
        timestamp: lead.createdAt,
        icon: 'user',
        color: 'blue'
      })),
      ...recentFAQs.map(faq => ({
        id: `faq-${faq.id}`,
        type: 'faq',
        title: 'New FAQ created',
        description: faq.question,
        timestamp: faq.createdAt,
        icon: 'question',
        color: 'purple'
      })),
      ...recentQueries.map(query => ({
        id: `query-${query.id}`,
        type: 'query',
        title: 'Unanswered query',
        description: query.query,
        timestamp: query.createdAt,
        icon: 'chat',
        color: query.status === 'pending' ? 'yellow' : 'green'
      }))
    ];

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, parseInt(limit));

    res.json({
      success: true,
      data: limitedActivities
    });

  } catch (error) {
    logger.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recent activity'
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity
};
