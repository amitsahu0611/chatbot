const express = require('express');
const router = express.Router();

// Import sub-routes
const dashboardRoutes = require('./dashboard');
const formBuilderRoutes = require('./form-builder');
const leadViewerRoutes = require('./lead-viewer');
const faqManagerRoutes = require('./faq-manager');
const supportSettingsRoutes = require('./support-settings');
const widgetManagementRoutes = require('./widget-management');
const themeSettingsRoutes = require('./theme-settings');

// Mount sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/form-builder', formBuilderRoutes);
router.use('/lead-viewer', leadViewerRoutes);
router.use('/faq-manager', faqManagerRoutes);
router.use('/support-settings', supportSettingsRoutes);
router.use('/widget-management', widgetManagementRoutes);
router.use('/theme-settings', themeSettingsRoutes);

// Company admin overview route
router.get('/overview', (req, res) => {
  res.json({
    success: true,
    message: 'Company Admin Overview',
    data: {
      companyId: req.company?.id,
      companyName: req.company?.name,
      totalForms: 0,
      totalLeads: 0,
      totalFAQs: 0,
      activeWidgets: 0
    }
  });
});

module.exports = router;
