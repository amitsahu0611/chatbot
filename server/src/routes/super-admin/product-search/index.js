const express = require('express');
const router = express.Router();
const productSearchController = require('../../../controllers/super-admin/productSearchController');
const { auth } = require('../../../middleware/auth');

// Product search routes
router.get('/search', auth, productSearchController.searchProducts);
router.get('/suggestions', auth, productSearchController.getSearchSuggestions);
router.get('/facets', auth, productSearchController.getFacetedSearch);
router.post('/sync', auth, productSearchController.syncProducts);
router.get('/stats', auth, productSearchController.getIndexStats);
router.delete('/clear', auth, productSearchController.clearIndex);

module.exports = router;
