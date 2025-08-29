require('dotenv').config({ path: './config.env' });
const { sequelize } = require('./src/config/database');
const SupportSettings = require('./src/models/company-admin/support-settings/SupportSettings');
const Company = require('./src/models/Company');

async function createSupportSettings() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Check if company with ID 13 exists
    const company = await Company.findByPk(13);
    if (!company) {
      console.log('Company with ID 13 does not exist. Please create it first.');
      return;
    }

    // Check if support settings already exist for company 13
    const existingSettings = await SupportSettings.findOne({
      where: { companyId: 13 }
    });

    if (existingSettings) {
      console.log('Support settings already exist for company 13.');
      return;
    }

    // Create support settings for company 13
    const supportSettings = await SupportSettings.create({
      companyId: 13,
      businessHours: {
        monday: { open: '09:00', close: '17:00', enabled: true },
        tuesday: { open: '09:00', close: '17:00', enabled: true },
        wednesday: { open: '09:00', close: '17:00', enabled: true },
        thursday: { open: '09:00', close: '17:00', enabled: true },
        friday: { open: '09:00', close: '17:00', enabled: true },
        saturday: { open: '10:00', close: '15:00', enabled: false },
        sunday: { open: '10:00', close: '15:00', enabled: false }
      },
      contactInfo: {
        email: 'support@testcompany.com',
        phone: '+1-555-0123',
        address: '123 Test Street, Test City, TC 12345'
      },
      autoResponse: {
        enabled: true,
        message: 'Thank you for contacting us! We\'ll get back to you within 24 hours.',
        offlineMessage: 'We\'re currently offline. Please leave a message and we\'ll respond when we\'re back.'
      },
      notificationSettings: {
        emailNotifications: true,
        slackNotifications: false,
        notificationEmail: 'admin@testcompany.com'
      },
      isActive: true
    });

    console.log('Support settings created successfully for company 13.');

  } catch (error) {
    console.error('Error creating support settings:', error);
  } finally {
    await sequelize.close();
  }
}

createSupportSettings();
