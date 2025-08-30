const ActivityLog = require('../models/ActivityLog');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

class ActivityLogger {
  static async log({
    type,
    entityType,
    entityId = null,
    userId = null,
    companyId = null,
    description,
    metadata = {},
    req = null
  }) {
    try {
      const activityData = {
        type,
        entityType,
        entityId,
        userId,
        companyId,
        description,
        metadata
      };

      // Extract IP and User Agent from request if provided
      if (req) {
        activityData.ipAddress = req.ip || req.connection.remoteAddress;
        activityData.userAgent = req.get('User-Agent');
      }

      const activity = await ActivityLog.create(activityData);
      logger.info(`Activity logged: ${type} - ${description}`, { activityId: activity.id });
      
      return activity;
    } catch (error) {
      logger.error('Failed to log activity:', error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  static async logUserAction(userId, type, description, metadata = {}, req = null) {
    return this.log({
      type,
      entityType: 'user',
      entityId: userId,
      userId,
      description,
      metadata,
      req
    });
  }

  static async logCompanyAction(companyId, userId, type, description, metadata = {}, req = null) {
    return this.log({
      type,
      entityType: 'company',
      entityId: companyId,
      userId,
      companyId,
      description,
      metadata,
      req
    });
  }

  static async logSystemAction(type, description, metadata = {}, req = null) {
    return this.log({
      type,
      entityType: 'system',
      description,
      metadata,
      req
    });
  }

  static async getRecentActivities(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        type = null,
        entityType = null,
        userId = null,
        companyId = null,
        startDate = null,
        endDate = null
      } = options;

      // Check if ActivityLog table exists first
      try {
        await ActivityLog.describe();
      } catch (tableError) {
        logger.warn('ActivityLog table does not exist, returning empty array');
        return [];
      }

      const whereClause = {};

      if (type) whereClause.type = type;
      if (entityType) whereClause.entityType = entityType;
      if (userId) whereClause.userId = userId;
      if (companyId) whereClause.companyId = companyId;

      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = startDate;
        if (endDate) whereClause.createdAt[Op.lte] = endDate;
      }

      const activities = await ActivityLog.findAll({
        where: whereClause,
        include: [
          {
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          },
          {
            model: require('../models/Company'),
            as: 'company',
            attributes: ['id', 'name'],
            required: false
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      return activities;
    } catch (error) {
      logger.error('Failed to fetch recent activities:', error);
      return [];
    }
  }

  static async getActivityStats(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await ActivityLog.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          createdAt: {
            [Op.gte]: startDate
          }
        },
        group: 'type',
        raw: true
      });

      return stats;
    } catch (error) {
      logger.error('Failed to fetch activity stats:', error);
      return [];
    }
  }
}

module.exports = ActivityLogger;
