const ThemeSettings = require('../../models/company-admin/ThemeSettings');
const { logger } = require('../../utils/logger');

/**
 * Get theme settings for a company
 */
const getThemeSettings = async (req, res) => {
  try {
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }

    let themeSettings = await ThemeSettings.findOne({
      where: { companyId, isActive: true }
    });

    // If no theme settings exist, create default ones
    if (!themeSettings) {
      themeSettings = await ThemeSettings.create({
        companyId,
        // All other fields will use their default values
      });
    }

    res.json({
      success: true,
      message: 'Theme settings retrieved successfully',
      data: themeSettings
    });
  } catch (error) {
    logger.error('Error getting theme settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve theme settings',
      error: error.message
    });
  }
};

/**
 * Update theme settings for a company
 */
const updateThemeSettings = async (req, res) => {
  try {
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }

    const updateData = req.body;

    // Validate color formats (hex colors)
    const colorFields = [
      'primaryColor', 'primaryBackgroundColor', 'secondaryColor', 'secondaryBackgroundColor',
      'accentColor', 'accentBackgroundColor', 'textColor', 'textSecondaryColor', 'textLightColor',
      'borderColor', 'borderLightColor', 'successColor', 'warningColor', 'errorColor', 'infoColor',
      'shadowColor'
    ];

    for (const field of colorFields) {
      if (updateData[field] && !/^#[0-9A-F]{6}$/i.test(updateData[field])) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid hex color code (e.g., #3b82f6)`
        });
      }
    }

    // Validate shadow opacity
    if (updateData.shadowOpacity !== undefined) {
      if (updateData.shadowOpacity < 0 || updateData.shadowOpacity > 1) {
        return res.status(400).json({
          success: false,
          message: 'shadowOpacity must be between 0 and 1'
        });
      }
    }

    // Validate animation duration
    if (updateData.animationDuration !== undefined) {
      if (updateData.animationDuration < 0 || updateData.animationDuration > 5000) {
        return res.status(400).json({
          success: false,
          message: 'animationDuration must be between 0 and 5000 milliseconds'
        });
      }
    }

    let themeSettings = await ThemeSettings.findOne({
      where: { companyId, isActive: true }
    });

    if (themeSettings) {
      await themeSettings.update(updateData);
    } else {
      themeSettings = await ThemeSettings.create({
        companyId,
        ...updateData
      });
    }

    res.json({
      success: true,
      message: 'Theme settings updated successfully',
      data: themeSettings
    });
  } catch (error) {
    logger.error('Error updating theme settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update theme settings',
      error: error.message
    });
  }
};

/**
 * Reset theme settings to default
 */
const resetThemeSettings = async (req, res) => {
  try {
    // For super admin, get companyId from query params or headers
    // For regular company admin, use their companyId
    let companyId = req.user.companyId;
    
    if (req.user.role === 'super_admin') {
      companyId = req.query.companyId || req.headers['x-company-id'] || req.user.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID is required for super admin'
        });
      }
    }
    
    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: 'Company context required'
      });
    }

    let themeSettings = await ThemeSettings.findOne({
      where: { companyId, isActive: true }
    });

    if (themeSettings) {
      // Reset to default values (excluding companyId and timestamps)
      await themeSettings.update({
        primaryColor: '#3b82f6',
        primaryBackgroundColor: '#ffffff',
        secondaryColor: '#64748b',
        secondaryBackgroundColor: '#f8fafc',
        accentColor: '#10b981',
        accentBackgroundColor: '#ecfdf5',
        textColor: '#1e293b',
        textSecondaryColor: '#64748b',
        textLightColor: '#94a3b8',
        borderColor: '#e2e8f0',
        borderLightColor: '#f1f5f9',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        errorColor: '#ef4444',
        infoColor: '#3b82f6',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        themeMode: 'light',
        customCSS: null,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        borderRadius: '8px',
        spacing: '16px',
        enableAnimations: true,
        animationDuration: 300,
        widgetOverrides: {}
      });
    } else {
      themeSettings = await ThemeSettings.create({
        companyId
        // All other fields will use their default values
      });
    }

    res.json({
      success: true,
      message: 'Theme settings reset to default successfully',
      data: themeSettings
    });
  } catch (error) {
    logger.error('Error resetting theme settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset theme settings',
      error: error.message
    });
  }
};

/**
 * Get theme settings for widget rendering (public API)
 */
const getWidgetThemeSettings = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const themeSettings = await ThemeSettings.findOne({
      where: { companyId, isActive: true }
    });

    if (!themeSettings) {
      return res.status(404).json({
        success: false,
        message: 'Theme settings not found'
      });
    }

    // Return only the necessary fields for widget rendering
    const widgetTheme = {
      primaryColor: themeSettings.primaryColor,
      primaryBackgroundColor: themeSettings.primaryBackgroundColor,
      secondaryColor: themeSettings.secondaryColor,
      secondaryBackgroundColor: themeSettings.secondaryBackgroundColor,
      accentColor: themeSettings.accentColor,
      accentBackgroundColor: themeSettings.accentBackgroundColor,
      textColor: themeSettings.textColor,
      textSecondaryColor: themeSettings.textSecondaryColor,
      textLightColor: themeSettings.textLightColor,
      borderColor: themeSettings.borderColor,
      borderLightColor: themeSettings.borderLightColor,
      successColor: themeSettings.successColor,
      warningColor: themeSettings.warningColor,
      errorColor: themeSettings.errorColor,
      infoColor: themeSettings.infoColor,
      shadowColor: themeSettings.shadowColor,
      shadowOpacity: themeSettings.shadowOpacity,
      themeMode: themeSettings.themeMode,
      fontFamily: themeSettings.fontFamily,
      fontSize: themeSettings.fontSize,
      borderRadius: themeSettings.borderRadius,
      spacing: themeSettings.spacing,
      enableAnimations: themeSettings.enableAnimations,
      animationDuration: themeSettings.animationDuration,
      customCSS: themeSettings.customCSS,
      widgetOverrides: themeSettings.widgetOverrides
    };

    res.json({
      success: true,
      data: widgetTheme
    });
  } catch (error) {
    logger.error('Error getting widget theme settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve widget theme settings',
      error: error.message
    });
  }
};

/**
 * Generate CSS variables from theme settings
 */
const generateThemeCSS = async (req, res) => {
  try {
    const { companyId } = req.params;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    const themeSettings = await ThemeSettings.findOne({
      where: { companyId, isActive: true }
    });

    if (!themeSettings) {
      return res.status(404).json({
        success: false,
        message: 'Theme settings not found'
      });
    }

    // Generate CSS variables
    const cssVariables = `
:root {
  /* Primary Colors */
  --primary-color: ${themeSettings.primaryColor};
  --primary-bg: ${themeSettings.primaryBackgroundColor};
  
  /* Secondary Colors */
  --secondary-color: ${themeSettings.secondaryColor};
  --secondary-bg: ${themeSettings.secondaryBackgroundColor};
  
  /* Accent Colors */
  --accent-color: ${themeSettings.accentColor};
  --accent-bg: ${themeSettings.accentBackgroundColor};
  
  /* Text Colors */
  --text-color: ${themeSettings.textColor};
  --text-secondary: ${themeSettings.textSecondaryColor};
  --text-light: ${themeSettings.textLightColor};
  
  /* Border Colors */
  --border-color: ${themeSettings.borderColor};
  --border-light: ${themeSettings.borderLightColor};
  
  /* Status Colors */
  --success-color: ${themeSettings.successColor};
  --warning-color: ${themeSettings.warningColor};
  --error-color: ${themeSettings.errorColor};
  --info-color: ${themeSettings.infoColor};
  
  /* Shadow */
  --shadow-color: ${themeSettings.shadowColor};
  --shadow-opacity: ${themeSettings.shadowOpacity};
  
  /* Typography */
  --font-family: ${themeSettings.fontFamily};
  --font-size: ${themeSettings.fontSize};
  
  /* Spacing & Layout */
  --border-radius: ${themeSettings.borderRadius};
  --spacing: ${themeSettings.spacing};
  
  /* Animation */
  --animation-duration: ${themeSettings.animationDuration}ms;
}

/* Custom CSS Overrides */
${themeSettings.customCSS || ''}
`;

    res.set('Content-Type', 'text/css');
    res.send(cssVariables);
  } catch (error) {
    logger.error('Error generating theme CSS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate theme CSS',
      error: error.message
    });
  }
};

module.exports = {
  getThemeSettings,
  updateThemeSettings,
  resetThemeSettings,
  getWidgetThemeSettings,
  generateThemeCSS
};
