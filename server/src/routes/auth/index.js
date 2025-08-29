const express = require('express');
const router = express.Router();

// Import auth sub-routes
const authRoutes = require('./auth');

// Mount auth routes
router.use('/', authRoutes);

module.exports = router;
