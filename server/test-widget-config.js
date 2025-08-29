require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');
const Widget = require('./src/models/company-admin/widget-management/Widget');

async function testWidgetConfig() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Test the widget config endpoint logic
    const widgetId = 'widget_13_test';
    
    console.log(`Testing widget config for widgetId: ${widgetId}`);
    
    // Find widget in database
    const widget = await Widget.findOne({
      where: { widgetId }
    });

    if (!widget) {
      console.log('❌ Widget not found');
      return;
    }

    console.log('✅ Widget found:', {
      id: widget.id,
      name: widget.name,
      type: widget.type,
      status: widget.status,
      isActive: widget.isActive,
      companyId: widget.companyId
    });

    if (!widget.isActive || widget.status !== 'active') {
      console.log('❌ Widget is not active');
      return;
    }

    const config = {
      widgetId: widget.widgetId,
      companyId: widget.companyId,
      config: {
        ...widget.settings,
        position: widget.settings.position || 'bottom-right',
        primaryColor: widget.settings.primaryColor || '#2563eb',
        size: widget.settings.size || 'normal',
        welcomeMessage: widget.settings.welcomeMessage || "Hello! 👋 I'm here to help you with any questions about our services."
      }
    };

    console.log('✅ Widget config generated successfully:');
    console.log(JSON.stringify(config, null, 2));

  } catch (error) {
    console.error('❌ Error testing widget config:', error);
  } finally {
    await sequelize.close();
  }
}

testWidgetConfig();
