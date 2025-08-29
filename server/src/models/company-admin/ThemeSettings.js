const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ThemeSettings = sequelize.define('ThemeSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  // Primary Colors
  primaryColor: {
    type: DataTypes.STRING(7), // Hex color code
    allowNull: false,
    defaultValue: '#3b82f6',
    comment: 'Primary brand color (hex)'
  },
  primaryBackgroundColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#ffffff',
    comment: 'Primary background color (hex)'
  },
  
  // Secondary Colors
  secondaryColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#64748b',
    comment: 'Secondary color (hex)'
  },
  secondaryBackgroundColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#f8fafc',
    comment: 'Secondary background color (hex)'
  },
  
  // Accent Colors
  accentColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#10b981',
    comment: 'Accent color for highlights (hex)'
  },
  accentBackgroundColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#ecfdf5',
    comment: 'Accent background color (hex)'
  },
  
  // Text Colors
  textColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#1e293b',
    comment: 'Primary text color (hex)'
  },
  textSecondaryColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#64748b',
    comment: 'Secondary text color (hex)'
  },
  textLightColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#94a3b8',
    comment: 'Light text color (hex)'
  },
  
  // Border Colors
  borderColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#e2e8f0',
    comment: 'Border color (hex)'
  },
  borderLightColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#f1f5f9',
    comment: 'Light border color (hex)'
  },
  
  // Status Colors
  successColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#10b981',
    comment: 'Success color (hex)'
  },
  warningColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#f59e0b',
    comment: 'Warning color (hex)'
  },
  errorColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#ef4444',
    comment: 'Error color (hex)'
  },
  infoColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#3b82f6',
    comment: 'Info color (hex)'
  },
  
  // Shadow and Effects
  shadowColor: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#000000',
    comment: 'Shadow color (hex)'
  },
  shadowOpacity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.1,
    comment: 'Shadow opacity (0-1)'
  },
  
  // Theme Mode
  themeMode: {
    type: DataTypes.ENUM('light', 'dark', 'auto'),
    allowNull: false,
    defaultValue: 'light',
    comment: 'Theme mode preference'
  },
  
  // Custom CSS (for advanced users)
  customCSS: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Custom CSS rules to override default styles'
  },
  
  // Font Settings
  fontFamily: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'Inter, system-ui, sans-serif',
    comment: 'Primary font family'
  },
  fontSize: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '14px',
    comment: 'Base font size'
  },
  
  // Border Radius
  borderRadius: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '8px',
    comment: 'Default border radius'
  },
  
  // Spacing
  spacing: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '16px',
    comment: 'Default spacing unit'
  },
  
  // Animation Settings
  enableAnimations: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether to enable animations'
  },
  animationDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 300,
    comment: 'Animation duration in milliseconds'
  },
  
  // Widget-specific overrides
  widgetOverrides: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {},
    comment: 'Widget-specific color overrides'
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the theme is active'
  }
}, {
  tableName: 'theme_settings',
  timestamps: true,
  indexes: [
    {
      fields: ['companyId']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = ThemeSettings;
