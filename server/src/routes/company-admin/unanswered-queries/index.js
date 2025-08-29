const express = require('express');
const router = express.Router();
const {
  getUnansweredQueries,
  updateQueryStatus,
  deleteQuery,
  getTopQueries,
  searchQueries
} = require('../../../controllers/company-admin/faq-manager/unansweredQueryController');
const { auth } = require('../../../middleware/auth');

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/company-admin/unanswered-queries
 * @desc    Get all unanswered queries for a company
 * @access  Private (Company Admin)
 * @query   companyId, page, limit, status, sortBy, sortOrder
 */
router.get('/', getUnansweredQueries);

/**
 * @route   GET /api/company-admin/unanswered-queries/top
 * @desc    Get top unanswered queries (most frequent)
 * @access  Private (Company Admin)
 * @query   companyId, limit
 */
router.get('/top', getTopQueries);

/**
 * @route   GET /api/company-admin/unanswered-queries/search
 * @desc    Search unanswered queries
 * @access  Private (Company Admin)
 * @query   companyId, searchTerm, page, limit
 */
router.get('/search', searchQueries);

/**
 * @route   PUT /api/company-admin/unanswered-queries/:queryId
 * @desc    Update unanswered query status
 * @access  Private (Company Admin)
 * @body    status, relatedFaqId, notes
 */
router.put('/:queryId', updateQueryStatus);

/**
 * @route   DELETE /api/company-admin/unanswered-queries/:queryId
 * @desc    Delete unanswered query
 * @access  Private (Company Admin)
 */
router.delete('/:queryId', deleteQuery);

module.exports = router;
