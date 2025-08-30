const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const { 
  User, 
  Company, 
  Lead, 
  Form, 
  FormSubmission, 
  FAQ, 
  UnansweredQuery,
  ActivityLog 
} = require('../../models');
const logger = require('../../utils/logger');
const ActivityLogger = require('../../services/activityLogger');

/**
 * Get dashboard statistics for super admin
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get total companies (this should work as companies table should exist)
    let totalCompanies = 0;
    let totalUsers = 0;
    
    try {
      totalCompanies = await Company.count({
        where: {
          isActive: true
        }
      });

      totalUsers = await User.count({
        where: {
          isActive: true
        }
      });
    } catch (basicError) {
      logger.error('Error fetching basic stats:', basicError);
      // If even basic tables don't exist, return default data
      return res.json({
        success: true,
        data: {
          totalCompanies: 0,
          totalUsers: 0,
          totalLeads: 0,
          totalFormSubmissions: 0,
          totalFAQs: 0,
          totalUnansweredQueries: 0,
          totalActiveWidgets: 0,
          companiesGrowth: 0,
          usersGrowth: 0,
          leadsGrowth: 0,
          subscriptionBreakdown: [],
          companyStatusBreakdown: [],
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get total leads across all companies (with fallback)
    let totalLeads = 0;
    try {
      totalLeads = await Lead.count();
    } catch (leadError) {
      logger.warn('Leads table not available:', leadError.message);
    }

    // Get total form submissions (with fallback)
    let totalFormSubmissions = 0;
    try {
      totalFormSubmissions = await FormSubmission.count();
    } catch (formError) {
      logger.warn('Form submissions table not available:', formError.message);
    }

    // Get total FAQs (with fallback)
    let totalFAQs = 0;
    try {
      totalFAQs = await FAQ.count();
    } catch (faqError) {
      logger.warn('FAQs table not available:', faqError.message);
    }

    // Get total unanswered queries (with fallback)
    let totalUnansweredQueries = 0;
    try {
      totalUnansweredQueries = await UnansweredQuery.count();
    } catch (queryError) {
      logger.warn('Unanswered queries table not available:', queryError.message);
    }

    // Calculate growth rates (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Companies growth
    const recentCompanies = await Company.count({
      where: {
        isActive: true,
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    const previousCompanies = await Company.count({
      where: {
        isActive: true,
        createdAt: {
          [Op.between]: [sixtyDaysAgo, thirtyDaysAgo]
        }
      }
    });

    const companiesGrowth = previousCompanies > 0 
      ? ((recentCompanies - previousCompanies) / previousCompanies * 100).toFixed(1)
      : 0;

    // Users growth (with fallback)
    let usersGrowth = 0;
    try {
      const recentUsers = await User.count({
        where: {
          isActive: true,
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      });

      const previousUsers = await User.count({
        where: {
          isActive: true,
          createdAt: {
            [Op.between]: [sixtyDaysAgo, thirtyDaysAgo]
          }
        }
      });

      usersGrowth = previousUsers > 0 
        ? ((recentUsers - previousUsers) / previousUsers * 100).toFixed(1)
        : 0;
    } catch (userGrowthError) {
      logger.warn('Could not calculate user growth:', userGrowthError.message);
      usersGrowth = 0;
    }

    // Leads growth (with fallback)
    let leadsGrowth = 0;
    try {
      const recentLeads = await Lead.count({
        where: {
          createdAt: {
            [Op.gte]: thirtyDaysAgo
          }
        }
      });

      const previousLeads = await Lead.count({
        where: {
          createdAt: {
            [Op.between]: [sixtyDaysAgo, thirtyDaysAgo]
          }
        }
      });

      leadsGrowth = previousLeads > 0 
        ? ((recentLeads - previousLeads) / previousLeads * 100).toFixed(1)
        : 0;
    } catch (leadGrowthError) {
      logger.warn('Could not calculate leads growth:', leadGrowthError.message);
      leadsGrowth = 0;
    }

    // Active widgets count (with fallback if widgets table doesn't exist)
    let totalActiveWidgets = 0;
    try {
      const activeWidgets = await sequelize.query(`
        SELECT COUNT(DISTINCT w.id) as count
        FROM widgets w
        INNER JOIN companies c ON w.companyId = c.id
        WHERE c.isActive = true AND w.isActive = true
      `, {
        type: sequelize.QueryTypes.SELECT
      });
      totalActiveWidgets = activeWidgets[0]?.count || 0;
    } catch (widgetError) {
      logger.warn('Widgets table not available, setting count to 0:', widgetError.message);
      totalActiveWidgets = 0;
    }

    // Subscription breakdown (with fallback)
    let subscriptionBreakdown = [];
    try {
      subscriptionBreakdown = await Company.findAll({
        attributes: [
          'subscriptionPlan',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          isActive: true
        },
        group: 'subscriptionPlan',
        raw: true
      });
    } catch (subError) {
      logger.warn('Could not get subscription breakdown:', subError.message);
    }

    // Company status breakdown (with fallback)
    let companyStatusBreakdown = [];
    try {
      companyStatusBreakdown = await Company.findAll({
        attributes: [
          'subscriptionStatus',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          isActive: true
        },
        group: 'subscriptionStatus',
        raw: true
      });
    } catch (statusError) {
      logger.warn('Could not get company status breakdown:', statusError.message);
    }

    res.json({
      success: true,
      data: {
        totalCompanies,
        totalUsers,
        totalLeads,
        totalFormSubmissions,
        totalFAQs,
        totalUnansweredQueries,
        totalActiveWidgets,
        companiesGrowth: parseFloat(companiesGrowth),
        usersGrowth: parseFloat(usersGrowth),
        leadsGrowth: parseFloat(leadsGrowth),
        subscriptionBreakdown,
        companyStatusBreakdown,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get recent activity across all companies
 */
const getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Try to get activities from the activity log first
    let formattedActivities = [];
    
    try {
      const activities = await ActivityLogger.getRecentActivities({
        limit,
        offset: 0
      });

      // Format activities for frontend
      formattedActivities = activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        company: activity.company?.name || 'Unknown Company',
        user: activity.user?.email || 'System',
        timestamp: activity.createdAt,
        metadata: {
          ...activity.metadata,
          userName: activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : null,
          description: activity.description
        }
      }));
    } catch (activityError) {
      logger.warn('ActivityLog table not available, falling back to model-based activity:', activityError.message);
      
      // Fallback to getting recent activities from models
      const [recentCompanies, recentUsers, recentLeads] = await Promise.all([
        Company.findAll({
          where: { isActive: true },
          include: [{
            model: User,
            as: 'users',
            where: { role: 'company_admin' },
            required: false,
            limit: 1
          }],
          order: [['createdAt', 'DESC']],
          limit: Math.floor(limit / 3)
        }),
        User.findAll({
          where: {
            isActive: true,
            role: { [Op.ne]: 'super_admin' }
          },
          include: [{
            model: Company,
            as: 'company',
            attributes: ['name']
          }],
          order: [['createdAt', 'DESC']],
          limit: Math.floor(limit / 3)
        }),
        Lead.findAll({
          include: [{
            model: User,
            as: 'assignedUser',
            include: [{
              model: Company,
              as: 'company',
              attributes: ['name']
            }],
            required: false
          }],
          order: [['createdAt', 'DESC']],
          limit: Math.floor(limit / 3)
        }).catch(() => [])
      ]);

      const activities = [];

      // Add company activities
      recentCompanies.forEach(company => {
        activities.push({
          id: `company_${company.id}`,
          type: 'company_registered',
          company: company.name,
          user: company.users?.[0]?.email || company.email,
          timestamp: company.createdAt,
          metadata: {
            subscriptionPlan: company.subscriptionPlan
          }
        });
      });

      // Add user activities
      recentUsers.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'user_created',
          company: user.company?.name || 'Unknown Company',
          user: user.email,
          timestamp: user.createdAt,
          metadata: {
            role: user.role,
            userName: `${user.firstName} ${user.lastName}`
          }
        });
      });

      // Add lead activities
      recentLeads.forEach(lead => {
        activities.push({
          id: `lead_${lead.id}`,
          type: 'lead_created',
          company: lead.assignedUser?.company?.name || 'Unknown Company',
          user: lead.email,
          timestamp: lead.createdAt,
          metadata: {
            status: lead.status,
            source: lead.source
          }
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      formattedActivities = activities.slice(0, limit);
    }

    res.json({
      success: true,
      data: formattedActivities
    });

  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity',
      error: error.message
    });
  }
};

/**
 * Get chart data for dashboard
 */
const getChartData = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const chartData = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [companies, users, leads, submissions] = await Promise.all([
        Company.count({
          where: {
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            },
            isActive: true
          }
        }),
        User.count({
          where: {
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            },
            isActive: true
          }
        }),
        Lead.count({
          where: {
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          }
        }).catch(() => 0),
        FormSubmission.count({
          where: {
            createdAt: {
              [Op.between]: [startOfMonth, endOfMonth]
            }
          }
        }).catch(() => 0)
      ]);

      chartData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        companies,
        users,
        leads,
        submissions
      });
    }

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    logger.error('Error fetching chart data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chart data',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity,
  getChartData
};
