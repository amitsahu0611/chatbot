require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');
const Widget = require('./src/models/company-admin/widget-management/Widget');
const Company = require('./src/models/Company');

async function createDynamicWidgets() {
  try {
    console.log('Creating dynamic widgets for the system...');
    
    // Get or create companies
    const companies = await Company.findAll();
    if (companies.length === 0) {
      console.log('No companies found. Creating default company...');
      const defaultCompany = await Company.create({
        name: 'Default Company',
        email: 'default@example.com',
        subscriptionStatus: 'active'
      });
      companies.push(defaultCompany);
    }

    // Define dynamic widgets to create
    const dynamicWidgets = [
      // Company-specific widgets
      { widgetId: 'widget_13_permanent', companyId: 13, name: 'Company 13 Permanent Widget' },
      { widgetId: 'widget_13_demo', companyId: 13, name: 'Company 13 Demo Widget' },
      { widgetId: 'widget_13_login', companyId: 13, name: 'Company 13 Login Widget' },
      { widgetId: 'widget_13_register', companyId: 13, name: 'Company 13 Register Widget' },
      
      // Super admin widgets
      { widgetId: 'widget_1_super_admin', companyId: 1, name: 'Super Admin Widget' },
      { widgetId: 'widget_1_demo', companyId: 1, name: 'Super Admin Demo Widget' },
      
      // Default company widgets
      { widgetId: 'widget_1_permanent', companyId: 1, name: 'Default Company Permanent Widget' },
      { widgetId: 'widget_1_demo', companyId: 1, name: 'Default Company Demo Widget' }
    ];

    // Create widgets for each company
    for (const company of companies) {
      const companyWidgets = dynamicWidgets.filter(w => w.companyId === company.id);
      
      for (const widgetData of companyWidgets) {
        const existingWidget = await Widget.findOne({
          where: { widgetId: widgetData.widgetId }
        });

        if (!existingWidget) {
          await Widget.create({
            widgetId: widgetData.widgetId,
            companyId: widgetData.companyId,
            name: widgetData.name,
            type: 'chat',
            status: 'active',
            isActive: true,
            embedCode: `<script src="http://localhost:5001/api/widget/chat.js" data-widget-id="${widgetData.widgetId}" data-company-id="${widgetData.companyId}"></script>`,
            settings: {
              position: 'bottom-right',
              primaryColor: '#2563eb',
              secondaryColor: '#1e40af',
              size: 'normal',
              welcomeMessage: "Hello! 👋 I'm here to help you with any questions about our services.",
              showAvatar: true,
              showTimestamp: true,
              enableNotifications: true,
              autoOpen: false,
              theme: 'light'
            },
            stats: {
              totalInteractions: 0,
              uniqueVisitors: 0,
              conversionRate: 0,
              totalSubmissions: 0
            }
          });
          console.log(`✅ Created widget: ${widgetData.widgetId} for company ${widgetData.companyId}`);
        } else {
          console.log(`⏭️ Widget already exists: ${widgetData.widgetId}`);
        }
      }
    }

    // Create additional widgets for other company IDs that might be used
    // Only create for companies that actually exist
    const existingCompanyIds = companies.map(c => c.id);
    const additionalCompanyIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15].filter(id => existingCompanyIds.includes(id));
    
    for (const companyId of additionalCompanyIds) {
      const widgetId = `widget_${companyId}_permanent`;
      const existingWidget = await Widget.findOne({
        where: { widgetId }
      });

      if (!existingWidget) {
        await Widget.create({
          widgetId,
          companyId,
          name: `Company ${companyId} Permanent Widget`,
          type: 'chat',
          status: 'active',
          isActive: true,
          embedCode: `<script src="http://localhost:5001/api/widget/chat.js" data-widget-id="${widgetId}" data-company-id="${companyId}"></script>`,
          settings: {
            position: 'bottom-right',
            primaryColor: '#2563eb',
            secondaryColor: '#1e40af',
            size: 'normal',
            welcomeMessage: "Hello! 👋 I'm here to help you with any questions about our services.",
            showAvatar: true,
            showTimestamp: true,
            enableNotifications: true,
            autoOpen: false,
            theme: 'light'
          },
          stats: {
            totalInteractions: 0,
            uniqueVisitors: 0,
            conversionRate: 0,
            totalSubmissions: 0
          }
        });
        console.log(`✅ Created widget: ${widgetId} for company ${companyId}`);
      }
    }

    console.log('🎉 All dynamic widgets created successfully!');
    
  } catch (error) {
    console.error('Error creating dynamic widgets:', error);
  } finally {
    await sequelize.close();
  }
}

createDynamicWidgets();
