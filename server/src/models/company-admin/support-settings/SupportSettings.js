const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const SupportSettings = sequelize.define('SupportSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  // Chat Widget Settings
  widgetSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      position: 'bottom-right',
      theme: 'light',
      primaryColor: '#3B82F6',
      welcomeMessage: 'Hello! How can I help you today?',
      offlineMessage: 'Sorry, we are currently offline. Please leave a message and we will get back to you soon.',
      showAgentAvatar: true,
      showAgentName: true,
      showTypingIndicator: true,
      autoOpen: false,
      autoOpenDelay: 5000,
      hideWhenOffline: false,
      customCSS: '',
      customJS: ''
    }
  },
  // Business Hours
  businessHours: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: false,
      timezone: 'UTC',
      schedule: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '10:00', end: '14:00' },
        sunday: { enabled: false, start: '10:00', end: '14:00' }
      },
      holidayMessage: 'We are closed for the holiday. We will be back soon!'
    }
  },
  // Auto-Response Settings
  autoResponse: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      welcomeMessage: 'Thank you for contacting us! An agent will be with you shortly.',
      awayMessage: 'Our agents are currently busy. Please wait and we will assist you as soon as possible.',
      offlineMessage: 'We are currently offline. Please leave a message and we will get back to you within 24 hours.',
      busyMessage: 'All our agents are currently busy. Please wait in the queue.',
      queuePositionMessage: 'You are in position {position} in the queue. Estimated wait time: {time} minutes.',
      transferMessage: 'Transferring you to {agent_name}. Please wait...',
      endChatMessage: 'Thank you for chatting with us! Have a great day!'
    }
  },
  // Notification Settings
  notifications: {
    type: DataTypes.JSON,
    defaultValue: {
      email: {
        enabled: true,
        newChat: true,
        chatTransfer: true,
        offlineMessage: true,
        dailyReport: false,
        weeklyReport: false,
        recipients: []
      },
      desktop: {
        enabled: true,
        newChat: true,
        chatTransfer: true,
        offlineMessage: true,
        sound: true
      },
      mobile: {
        enabled: false,
        newChat: true,
        chatTransfer: true,
        offlineMessage: true,
        pushNotifications: false
      }
    }
  },
  // Chat Settings
  chatSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      maxAgents: 10,
      maxVisitors: 100,
      maxChatsPerAgent: 5,
      chatTimeout: 300, // 5 minutes
      idleTimeout: 1800, // 30 minutes
      allowFileUpload: true,
      maxFileSize: 5242880, // 5MB
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      enableEmojis: true,
      enableTypingIndicator: true,
      enableReadReceipts: true,
      enableChatHistory: true,
      enableVisitorInfo: true,
      enableAgentNotes: true,
      enableChatRating: true,
      enableTranscript: true,
      autoAssignChats: true,
      roundRobinAssignment: true,
      skillBasedAssignment: false,
      enableChatbot: true,
      chatbotTriggerWords: ['help', 'support', 'assistance'],
      enableProactiveChat: false,
      proactiveChatDelay: 30000, // 30 seconds
      proactiveChatMessage: 'Hello! I noticed you\'ve been browsing for a while. Can I help you with anything?'
    }
  },
  // Integration Settings
  integrations: {
    type: DataTypes.JSON,
    defaultValue: {
      slack: {
        enabled: false,
        webhookUrl: '',
        channel: '#support',
        notifications: {
          newChat: true,
          chatTransfer: true,
          offlineMessage: true
        }
      },
      discord: {
        enabled: false,
        webhookUrl: '',
        channel: 'support',
        notifications: {
          newChat: true,
          chatTransfer: true,
          offlineMessage: true
        }
      },
      webhook: {
        enabled: false,
        url: '',
        events: ['new_chat', 'chat_transfer', 'offline_message', 'chat_end']
      },
      zapier: {
        enabled: false,
        webhookUrl: '',
        events: ['new_chat', 'chat_transfer', 'offline_message', 'chat_end']
      }
    }
  },
  // Customization
  customization: {
    type: DataTypes.JSON,
    defaultValue: {
      logo: '',
      favicon: '',
      brandName: '',
      brandColor: '#3B82F6',
      customCSS: '',
      customJS: '',
      headerText: 'Customer Support',
      footerText: 'Powered by ChatBot',
      showPoweredBy: true,
      language: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    }
  },
  // Security Settings
  security: {
    type: DataTypes.JSON,
    defaultValue: {
      requireEmail: false,
      requireName: false,
      blockSuspiciousIPs: true,
      rateLimit: {
        enabled: true,
        maxRequests: 100,
        windowMs: 900000 // 15 minutes
      },
      allowedDomains: [],
      blockedDomains: [],
      allowedIPs: [],
      blockedIPs: [],
      enableCaptcha: false,
      enableTwoFactor: false
    }
  },
  // Analytics Settings
  analytics: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      trackPageViews: true,
      trackClicks: true,
      trackScrollDepth: true,
      trackTimeOnPage: true,
      trackConversions: true,
             enableHeatmaps: false,
       enableSessionRecording: false,
       enableABTesting: false,
      googleAnalytics: {
        enabled: false,
        trackingId: ''
      },
      facebookPixel: {
        enabled: false,
        pixelId: ''
      }
    }
  },
  // Advanced Settings
  advanced: {
    type: DataTypes.JSON,
    defaultValue: {
      enableDebugMode: false,
      enableLogging: true,
      logLevel: 'info',
      enableBackup: true,
      backupFrequency: 'daily',
      enableAutoUpdate: true,
      enableBetaFeatures: false,
      enableExperimentalFeatures: false,
      maxLogRetention: 30, // days
      enablePerformanceMonitoring: true,
      enableErrorTracking: true
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'support_settings',
  timestamps: true,
  indexes: [
    {
      fields: ['company_id']
    }
  ]
});

module.exports = SupportSettings;
