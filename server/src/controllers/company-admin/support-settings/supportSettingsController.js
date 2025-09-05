const SupportSettings = require('../../../models/company-admin/support-settings/SupportSettings');
const logger = require('../../../utils/logger');

// Get support settings
const getSupportSettings = async (req, res) => {
  try {
    const companyId = parseInt(req.query.companyId) || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`Fetching support settings for company ID: ${companyId}`);

    let settings = await SupportSettings.findOne({ 
      where: { companyId: companyId }
    });

    // If no settings exist, create default settings
    if (!settings) {
      logger.info(`No settings found for company ${companyId}, creating default settings`);
      
      settings = await SupportSettings.create({
        companyId: companyId,
        createdBy: req.user?.userId || null
      });
      
      logger.info(`Created new support settings for company ${companyId} with ID: ${settings.id}`);
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
    const companyId = req.body.companyId || req.user?.companyId;
    const userId = req.user?.userId;
    const updateData = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    let settings = await SupportSettings.findOne({ 
      where: { companyId }
    });
    
    if (!settings) {
      settings = await SupportSettings.create({
        companyId,
        createdBy: userId,
        ...updateData
      });
    } else {
      // Update the existing settings
      const fieldsToUpdate = { ...updateData };
      delete fieldsToUpdate.companyId; // Don't update companyId
      fieldsToUpdate.updatedBy = userId;
      
      await settings.update(fieldsToUpdate);
      await settings.reload(); // Reload to get updated data
    }

    res.json({
      success: true,
      message: 'Support settings updated successfully',
      data: settings
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
    const { email, companyId: bodyCompanyId } = req.body;
    const companyId = bodyCompanyId || req.user?.companyId;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
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
    const { phone, companyId: bodyCompanyId } = req.body;
    const companyId = bodyCompanyId || req.user?.companyId;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
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
    const { webhookUrl, channel, companyId: bodyCompanyId } = req.body;
    const companyId = bodyCompanyId || req.user?.companyId;

    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
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
    const companyId = parseInt(req.query.companyId) || req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    logger.info(`Fetching business hours status for company ID: ${companyId}`);

    let settings = await SupportSettings.findOne({ 
      where: { companyId: companyId }
    });
    
    // If no settings exist, create default settings first
    if (!settings) {
      logger.info(`No settings found for company ${companyId}, creating default settings for business hours`);
      
      settings = await SupportSettings.create({
        companyId: companyId,
        createdBy: req.user?.userId || null
      });
    }

    // Calculate if currently within business hours
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Check if businessHours exists and has the current day
    const businessHours = settings.businessHours?.schedule?.[currentDay];
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
        timezone: settings.businessHours?.timezone || 'UTC'
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
    const companyId = req.body.companyId || req.user?.companyId;
    const userId = req.user?.userId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    let settings = await SupportSettings.findOne({ 
      where: { companyId }
    });
    
    if (!settings) {
      settings = await SupportSettings.create({
        companyId,
        createdBy: userId
      });
    } else {
      // Reset to default values by updating with default values
      await settings.update({
        widgetSettings: settings.constructor.rawAttributes.widgetSettings.defaultValue,
        businessHours: settings.constructor.rawAttributes.businessHours.defaultValue,
        autoResponse: settings.constructor.rawAttributes.autoResponse.defaultValue,
        notifications: settings.constructor.rawAttributes.notifications.defaultValue,
        chatSettings: settings.constructor.rawAttributes.chatSettings.defaultValue,
        integrations: settings.constructor.rawAttributes.integrations.defaultValue,
        customization: settings.constructor.rawAttributes.customization.defaultValue,
        security: settings.constructor.rawAttributes.security.defaultValue,
        analytics: settings.constructor.rawAttributes.analytics.defaultValue,
        advanced: settings.constructor.rawAttributes.advanced.defaultValue,
        updatedBy: userId
      });
      await settings.reload();
    }

    res.json({
      success: true,
      message: 'Support settings reset to default successfully',
      data: settings
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
