const express = require('express');
const router = express.Router();
const { auth } = require('../../middleware/auth');
const {
  getDashboardStats,
  getRecentActivity,
  getChartData
} = require('../../controllers/super-admin/dashboardController');

// Import sub-routes
const companiesRoutes = require('./companies');
const usersRoutes = require('./users');
const formsRoutes = require('./forms');
const productsRoutes = require('./products');
const productSearchRoutes = require('./product-search');

// Mount sub-routes
router.use('/companies', companiesRoutes);
router.use('/users', usersRoutes);
router.use('/forms', formsRoutes);
router.use('/products', productsRoutes);
router.use('/product-search', productSearchRoutes);

// Super admin dashboard routes
router.get('/dashboard/stats', auth, getDashboardStats);
router.get('/dashboard/activity', auth, getRecentActivity);
router.get('/dashboard/charts', auth, getChartData);

// Backward compatibility route
router.get('/dashboard', auth, getDashboardStats);

module.exports = router;
