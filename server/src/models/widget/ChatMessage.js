const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ipAddress: {
    type: DataTypes.STRING(45), // IPv6 compatible
    allowNull: false,
    comment: 'IP address of the user'
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Company ID for the chat session'
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Unique session identifier'
  },
  messageType: {
    type: DataTypes.ENUM('user', 'bot'),
    allowNull: false,
    comment: 'Type of message (user or bot)'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Message content'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Message timestamp'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional message metadata (user agent, etc.)'
  }
}, {
  tableName: 'chat_messages',
  timestamps: true,
  indexes: [
    {
      fields: ['ipAddress', 'companyId']
    },
    {
      fields: ['sessionId']
    },
    {
      fields: ['timestamp']
    }
  ]
});

module.exports = ChatMessage;
