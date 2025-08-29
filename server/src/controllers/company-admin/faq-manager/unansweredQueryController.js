const UnansweredQuery = require('../../../models/company-admin/faq-manager/UnansweredQuery');
const FAQ = require('../../../models/company-admin/faq-manager/FAQ');
const logger = require('../../../utils/logger');
const { Op } = require('sequelize');

/**
 * Get all unanswered queries for a company
 */
const getUnansweredQueries = async (req, res) => {
  try {
    const { companyId } = req.query;
    const { page = 1, limit = 20, status = 'pending', sortBy = 'frequency', sortOrder = 'DESC' } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {
      companyId: parseInt(companyId)
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    // Build order clause
    const validSortFields = ['frequency', 'lastAsked', 'createdAt', 'priority'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'frequency';
    const orderDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    logger.info(`📋 Getting unanswered queries for company ${companyId}`);

    const { count, rows: queries } = await UnansweredQuery.findAndCountAll({
      where: whereClause,
      order: [[orderField, orderDirection]],
      limit: parseInt(limit),
      offset: offset
    });

    // Get summary statistics
    const stats = await UnansweredQuery.findAll({
      where: { companyId: parseInt(companyId) },
      attributes: [
        'status',
        [UnansweredQuery.sequelize.fn('COUNT', UnansweredQuery.sequelize.col('id')), 'count'],
        [UnansweredQuery.sequelize.fn('SUM', UnansweredQuery.sequelize.col('frequency')), 'totalFrequency']
      ],
      group: ['status'],
      raw: true
    });

    const summaryStats = {
      pending: 0,
      answered: 0,
      ignored: 0,
      totalQuestions: 0,
      totalFrequency: 0
    };

    stats.forEach(stat => {
      summaryStats[stat.status] = parseInt(stat.count);
      summaryStats.totalFrequency += parseInt(stat.totalFrequency || 0);
    });

    summaryStats.totalQuestions = summaryStats.pending + summaryStats.answered + summaryStats.ignored;

    res.json({
      success: true,
      data: {
        queries: queries.map(query => ({
          id: query.id,
          query: query.query,
          frequency: query.frequency,
          status: query.status,
          priority: query.priority,
          lastAsked: query.lastAsked,
          createdAt: query.createdAt,
          relatedFaq: null, // Will be loaded separately if needed
          notes: query.notes
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        stats: summaryStats
      }
    });

  } catch (error) {
    logger.error('Error getting unanswered queries:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving unanswered queries'
    });
  }
};

/**
 * Update unanswered query status
 */
const updateQueryStatus = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status, relatedFaqId, notes, autoCreateFaq, faqAnswer, faqCategory = 'General' } = req.body;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message: 'Query ID is required'
      });
    }

    const validStatuses = ['pending', 'answered', 'ignored'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, answered, or ignored'
      });
    }

    logger.info(`📝 Updating unanswered query ${queryId} status to ${status}`);

    const query = await UnansweredQuery.findByPk(queryId);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Unanswered query not found'
      });
    }

    let createdFaqId = relatedFaqId;

    // Auto-create FAQ if status is 'answered' and autoCreateFaq is true
    if (status === 'answered' && autoCreateFaq && faqAnswer) {
      try {
        logger.info(`🔄 Auto-creating FAQ for query: "${query.query}"`);
        
        const newFaq = await FAQ.create({
          companyId: query.companyId,
          question: query.query,
          answer: faqAnswer,
          category: faqCategory,
          tags: [], // Can be enhanced to extract tags from query
          searchKeywords: [], // Can be enhanced to extract keywords
          order: 0,
          isActive: true,
          views: 0,
          helpfulCount: 0,
          createdBy: req.user?.userId || null,
          updatedBy: req.user?.userId || null
        });

        createdFaqId = newFaq.id;
        logger.info(`✅ Auto-created FAQ with ID: ${newFaq.id}`);

      } catch (faqError) {
        logger.error('Error auto-creating FAQ:', faqError);
        // Continue with query update even if FAQ creation fails
      }
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (createdFaqId) updateData.relatedFaqId = createdFaqId;
    if (notes !== undefined) updateData.notes = notes;

    await query.update(updateData);

    res.json({
      success: true,
      message: status === 'answered' && autoCreateFaq ? 'Query marked as answered and FAQ created successfully' : 'Query status updated successfully',
      data: {
        id: query.id,
        status: query.status,
        relatedFaqId: query.relatedFaqId,
        notes: query.notes,
        autoCreatedFaq: createdFaqId && autoCreateFaq
      }
    });

  } catch (error) {
    logger.error('Error updating query status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating query status'
    });
  }
};

/**
 * Delete unanswered query
 */
const deleteQuery = async (req, res) => {
  try {
    const { queryId } = req.params;

    if (!queryId) {
      return res.status(400).json({
        success: false,
        message: 'Query ID is required'
      });
    }

    logger.info(`🗑️ Deleting unanswered query ${queryId}`);

    const query = await UnansweredQuery.findByPk(queryId);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: 'Unanswered query not found'
      });
    }

    await query.destroy();

    res.json({
      success: true,
      message: 'Query deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting query:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting query'
    });
  }
};

/**
 * Get top unanswered queries (most frequent)
 */
const getTopQueries = async (req, res) => {
  try {
    const { companyId } = req.query;
    const { limit = 10 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`📊 Getting top unanswered queries for company ${companyId}`);

    const queries = await UnansweredQuery.getTopUnansweredForCompany(
      parseInt(companyId),
      parseInt(limit)
    );

    res.json({
      success: true,
      data: queries.map(query => ({
        id: query.id,
        query: query.query,
        frequency: query.frequency,
        priority: query.priority,
        lastAsked: query.lastAsked
      }))
    });

  } catch (error) {
    logger.error('Error getting top queries:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving top queries'
    });
  }
};

/**
 * Search unanswered queries
 */
const searchQueries = async (req, res) => {
  try {
    const { companyId, searchTerm } = req.query;
    const { page = 1, limit = 20 } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    logger.info(`🔍 Searching unanswered queries for company ${companyId} with term: "${searchTerm}"`);

    const { count, rows: queries } = await UnansweredQuery.findAndCountAll({
      where: {
        companyId: parseInt(companyId),
        [Op.or]: [
          { query: { [Op.like]: `%${searchTerm}%` } },
          { notes: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      order: [['frequency', 'DESC'], ['lastAsked', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      success: true,
      data: {
        queries: queries.map(query => ({
          id: query.id,
          query: query.query,
          frequency: query.frequency,
          status: query.status,
          priority: query.priority,
          lastAsked: query.lastAsked,
          relatedFaq: null, // Will be loaded separately if needed
          notes: query.notes
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error searching queries:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching queries'
    });
  }
};

module.exports = {
  getUnansweredQueries,
  updateQueryStatus,
  deleteQuery,
  getTopQueries,
  searchQueries
};
