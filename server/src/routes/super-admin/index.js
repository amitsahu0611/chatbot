const express = require('express');
const router = express.Router();

// Import sub-routes
const companiesRoutes = require('./companies');
const usersRoutes = require('./users');

// Mount sub-routes
router.use('/companies', companiesRoutes);
router.use('/users', usersRoutes);

// Super admin dashboard route
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Super Admin Dashboard',
    data: {
      totalCompanies: 0,
      totalUsers: 0,
      activeWidgets: 0,
      totalLeads: 0
    }
  });
});

module.exports = router;
