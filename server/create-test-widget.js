require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');
const Widget = require('./src/models/company-admin/widget-management/Widget');
const Company = require('./src/models/Company');

async function createTestWidget() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Check if company with ID 13 exists, if not create it
    let company = await Company.findByPk(13);
    if (!company) {
      console.log('Creating test company with ID 13...');
      company = await Company.create({
        id: 13,
        name: 'Test Company',
        domain: 'testcompany.com',
        email: 'test@testcompany.com',
        subscriptionStatus: 'active',
        settings: {
          theme: 'light',
          primaryColor: '#3b82f6'
        }
      });
      console.log('Test company created successfully.');
    }

    // Check if widget already exists
    const existingWidget = await Widget.findOne({
      where: { widgetId: 'widget_13_test' }
    });

    if (existingWidget) {
      console.log('Test widget already exists.');
      return;
    }

    // Create test widget
    const testWidget = await Widget.create({
      companyId: 13,
      name: 'Test Chat Widget',
      type: 'chat',
      status: 'active',
      domain: 'testcompany.com',
      widgetId: 'widget_13_test',
      settings: {
        theme: 'light',
        position: 'bottom-right',
        primaryColor: '#3b82f6',
        welcomeMessage: 'Hello! 👋 I\'m here to help you with any questions about our services.',
        showAgentAvatar: true,
        showAgentName: true,
        autoOpen: false,
        autoOpenDelay: 5000,
        hideWhenOffline: false
      },
      stats: {
        totalInteractions: 0,
        uniqueVisitors: 0,
        conversionRate: 0,
        totalSubmissions: 0
      },
      embedCode: '<script src="http://localhost:5001/api/widget/chat.js" data-widget-id="widget_13_test" data-company-id="13"></script>',
      isActive: true
    });

    console.log('Test widget created successfully:', testWidget.widgetId);
    console.log('Widget config available at: /api/widget/config?widgetId=widget_13_test');

  } catch (error) {
    console.error('Error creating test widget:', error);
  } finally {
    await sequelize.close();
  }
}

createTestWidget();
