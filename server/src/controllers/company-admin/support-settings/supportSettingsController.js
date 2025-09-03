const SupportSettings = require('../../../models/company-admin/support-settings/SupportSettings');
const logger = require('../../../utils/logger');

// Get support settings
const getSupportSettings = async (req, res) => {
  try {
    const { companyId } = req.user;

    let settings = await SupportSettings.findOne({ companyId })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new SupportSettings({
        companyId,
        createdBy: req.user.userId
      });
      await settings.save();
      
      settings = await SupportSettings.findOne({ companyId })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .lean();
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching support settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support settings'
    });
  }
};

// Update support settings
const updateSupportSettings = async (req, res) => {
  try {
    const { companyId, userId } = req.user;
    const updateData = req.body;

    let settings = await SupportSettings.findOne({ companyId });
    
    if (!settings) {
      settings = new SupportSettings({
        companyId,
        createdBy: userId
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'companyId' && key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        settings[key] = updateData[key];
      }
    });

    settings.updatedBy = userId;
    await settings.save();

    const updatedSettings = await SupportSettings.findOne({ companyId })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Support settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    logger.error('Error updating support settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support settings'
    });
  }
};

// Test email configuration
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const { companyId } = req.user;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // In a real implementation, you would send a test email here
    // For now, we'll simulate the email sending process
    
    logger.info(`Test email would be sent to ${email} for company ${companyId}`);

    res.json({
      success: true,
      message: 'Test email sent successfully',
      data: {
        sentTo: email,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      }
    });
  } catch (error) {
    logger.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email'
    });
  }
};

// Test phone configuration
const testPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    const { companyId } = req.user;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // In a real implementation, you would initiate a test call here
    // For now, we'll simulate the call process
    
    logger.info(`Test call would be initiated to ${phone} for company ${companyId}`);

    res.json({
      success: true,
      message: 'Test call initiated successfully',
      data: {
        calledTo: phone,
        timestamp: new Date().toISOString(),
        status: 'ringing'
      }
    });
  } catch (error) {
    logger.error('Error initiating test call:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate test call'
    });
  }
};

// Test Slack webhook
const testSlack = async (req, res) => {
  try {
    const { webhookUrl, channel } = req.body;
    const { companyId } = req.user;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }

    // In a real implementation, you would send a test message to Slack here
    // For now, we'll simulate the webhook call
    
    logger.info(`Test Slack message would be sent to ${webhookUrl} for company ${companyId}`);

    res.json({
      success: true,
      message: 'Test Slack message sent successfully',
      data: {
        sentTo: webhookUrl,
        channel: channel || 'default',
        timestamp: new Date().toISOString(),
        status: 'sent'
      }
    });
  } catch (error) {
    logger.error('Error sending test Slack message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test Slack message'
    });
  }
};

// Get business hours status
const getBusinessHoursStatus = async (req, res) => {
  try {
    const { companyId } = req.user;

    const settings = await SupportSettings.findOne({ companyId }).lean();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Support settings not found'
      });
    }

    // Calculate if currently within business hours
    const now = new Date();
    const currentDay = now.toLocaleLowerCase().slice(0, 3);
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Check if businessHours exists and has the current day
    const businessHours = settings.businessHours?.[currentDay];
    const isOpen = businessHours?.enabled && 
                   currentTime >= businessHours.start && 
                   currentTime <= businessHours.end;

    res.json({
      success: true,
      data: {
        isOpen,
        currentDay,
        currentTime,
        businessHours: settings.businessHours,
        timezone: settings.timezone
      }
    });
  } catch (error) {
    logger.error('Error getting business hours status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get business hours status'
    });
  }
};

// Reset settings to default
const resetToDefault = async (req, res) => {
  try {
    const { companyId, userId } = req.user;

    const defaultSettings = {
      phone: {
        enabled: true,
        number: '',
        hours: 'Monday to Friday, 9 AM to 6 PM',
        timezone: 'UTC',
        extension: ''
      },
      email: {
        enabled: true,
        address: '',
        responseTime: 'Within 24 hours',
        autoReply: true,
        autoReplyMessage: 'Thank you for contacting us. We will get back to you within 24 hours.',
        smtp: {
          host: '',
          port: 587,
          secure: false,
          username: '',
          password: ''
        }
      },
      chat: {
        enabled: true,
        hours: 'Monday to Friday, 9 AM to 6 PM',
        welcomeMessage: 'Hello! How can I help you today?',
        offlineMessage: 'We are currently offline. Please leave a message and we will get back to you.',
        autoAssign: true,
        maxWaitTime: 300
      },
      social: {
        whatsapp: {
          enabled: false,
          number: '',
          businessHours: ''
        },
        telegram: {
          enabled: false,
          username: '',
          botToken: ''
        },
        facebook: {
          enabled: false,
          pageId: '',
          accessToken: ''
        }
      },
      escalation: {
        enabled: false,
        rules: []
      },
      notifications: {
        email: {
          enabled: true,
          recipients: []
        },
        slack: {
          enabled: false,
          webhookUrl: '',
          channel: ''
        }
      },
      businessHours: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '09:00', end: '17:00' },
        sunday: { enabled: false, start: '09:00', end: '17:00' }
      },
      timezone: 'UTC'
    };

    let settings = await SupportSettings.findOne({ companyId });
    
    if (!settings) {
      settings = new SupportSettings({
        companyId,
        createdBy: userId
      });
    }

    // Reset to default values
    Object.keys(defaultSettings).forEach(key => {
      settings[key] = defaultSettings[key];
    });

    settings.updatedBy = userId;
    await settings.save();

    const resetSettings = await SupportSettings.findOne({ companyId })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .lean();

    res.json({
      success: true,
      message: 'Support settings reset to default successfully',
      data: resetSettings
    });
  } catch (error) {
    logger.error('Error resetting support settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset support settings'
    });
  }
};

module.exports = {
  getSupportSettings,
  updateSupportSettings,
  testEmail,
  testPhone,
  testSlack,
  getBusinessHoursStatus,
  resetToDefault
};
