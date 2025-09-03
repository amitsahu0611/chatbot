const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * /api/widget/embed/script:
 *   get:
 *     summary: Get embeddable widget script
 *     description: Returns the JavaScript code for the embeddable chat widget
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID for the widget
 *       - in: query
 *         name: widgetId
 *         required: false
 *         schema:
 *           type: string
 *         description: Specific widget configuration ID
 *       - in: query
 *         name: position
 *         required: false
 *         schema:
 *           type: string
 *           enum: [bottom-right, bottom-left, top-right, top-left]
 *         description: Widget position on the page
 *       - in: query
 *         name: primaryColor
 *         required: false
 *         schema:
 *           type: string
 *         description: Primary color (hex format)
 *       - in: query
 *         name: secondaryColor
 *         required: false
 *         schema:
 *           type: string
 *         description: Secondary color (hex format)
 *     responses:
 *       200:
 *         description: Widget script returned successfully
 *         content:
 *           application/javascript:
 *             schema:
 *               type: string
 */
const getWidgetScript = async (req, res) => {
  try {
    const {
      companyId,
      widgetId = null,
      position = 'bottom-right',
      primaryColor = '#667eea',
      secondaryColor = '#764ba2',
      theme = 'default'
    } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Get the base URL for API calls
    const protocol = req.protocol;
    const host = req.get('host');
    const apiUrl = `${protocol}://${host}`;

    // Generate the widget script with configuration
    const widgetScript = generateWidgetScript({
      companyId,
      widgetId,
      position,
      primaryColor,
      secondaryColor,
      theme,
      apiUrl
    });

    // Set appropriate headers (no cache for development)
    res.set({
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    res.send(widgetScript);
  } catch (error) {
    console.error('Error generating widget script:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate widget script'
    });
  }
};

/**
 * @swagger
 * /api/widget/embed/config:
 *   get:
 *     summary: Get widget configuration
 *     description: Returns configuration for a specific widget
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: query
 *         name: widgetId
 *         required: false
 *         schema:
 *           type: string
 *         description: Widget ID
 *     responses:
 *       200:
 *         description: Widget configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
const getWidgetConfig = async (req, res) => {
  try {
    const { companyId, widgetId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required'
      });
    }

    // Default configuration
    let config = {
      companyId,
      widgetId: widgetId || 'default',
      position: 'bottom-right',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      fontFamily: 'Inter, system-ui, sans-serif',
      theme: 'default',
      welcomeMessage: 'Hello! How can I help you today?',
      placeholderText: 'Type your message...',
      title: 'AI Assistant',
      subtitle: 'Powered by Nowgray'
    };

    // If widgetId is provided, try to get specific configuration
    if (widgetId) {
      try {
        const Widget = require('../../models/company-admin/widget-management/Widget');
        const widget = await Widget.findOne({
          where: {
            id: widgetId,
            companyId: companyId
          }
        });

        if (widget) {
          // Merge widget-specific configuration
          config = {
            ...config,
            ...widget.configuration,
            widgetId: widget.id,
            name: widget.name
          };
        }
      } catch (error) {
        console.warn('Widget not found, using default config:', error.message);
      }
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting widget config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get widget configuration'
    });
  }
};

// Function to generate the complete widget script
function generateWidgetScript(config) {
  return `
/*! Nowgray Chat Widget - Generated for Company: ${config.companyId} */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.NowgrayChatWidget) {
    return;
  }

  // Widget configuration
  const WIDGET_CONFIG = ${JSON.stringify(config, null, 2)};

  // Global widget manager
  window.NowgrayChatWidget = {
    config: WIDGET_CONFIG,
    isLoaded: false,
    isOpen: false,
    messages: [],
    currentSessionId: null,
    
    // Initialize the widget
    init: function() {
      this.loadStyles();
      this.createWidget();
      this.loadChatHistory();
      this.setupScrollHandlers();
      this.isLoaded = true;
      
      console.log('✅ Nowgray Chat Widget loaded for Company:', this.config.companyId);
      
      // Trigger custom event
      const event = new CustomEvent('nowgray-widget-loaded', {
        detail: { config: this.config }
      });
      window.dispatchEvent(event);
    },
    
    // Create widget HTML
    createWidget: function() {
      const container = document.createElement('div');
      container.id = 'nowgray-chat-widget';
      container.className = 'nowgray-widget-container';
      
      const positionClass = this.getPositionClass();
      
      container.innerHTML = \`
        <div class="nowgray-widget \${positionClass}">
          <!-- Chat Button -->
          <button id="nowgray-chat-button" class="nowgray-chat-button" onclick="NowgrayChatWidget.toggleChat()">
            <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </button>
          
          <!-- Chat Window -->
          <div id="nowgray-chat-window" class="nowgray-chat-window" style="display: none;">
            <!-- Header -->
            <div class="nowgray-chat-header">
              <div class="nowgray-header-content">
                <div class="nowgray-status-indicator"></div>
                <div class="nowgray-header-text">
                  <h3>AI Assistant</h3>
                  <p>Powered by Nowgray</p>
                </div>
              </div>
                          <div class="nowgray-header-actions">
              <button class="nowgray-history-btn" onclick="NowgrayChatWidget.toggleHistoryView()" title="Chat History">
                📜
              </button>
              <button class="nowgray-new-chat-btn" onclick="NowgrayChatWidget.startNewChat()" title="Start New Chat">
                🔄
              </button>
              <button class="nowgray-close-btn" onclick="NowgrayChatWidget.toggleChat()">×</button>
            </div>
            </div>
            
            <!-- Messages Area -->
            <div id="nowgray-messages" class="nowgray-messages">
              <div id="nowgray-loading" class="nowgray-loading">
                <div class="nowgray-spinner"></div>
                <span>Loading chat history...</span>
              </div>
            </div>
            
            <!-- Input Area -->
            <div class="nowgray-input-area">
              <div class="nowgray-input-container">
                <input 
                  type="text" 
                  id="nowgray-message-input" 
                  placeholder="Type your message..."
                  onkeypress="NowgrayChatWidget.handleKeyPress(event)"
                />
                <button onclick="NowgrayChatWidget.sendMessage()">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      \`;
      
      document.body.appendChild(container);
    },
    
    // Get position class
    getPositionClass: function() {
      const positions = {
        'bottom-left': 'pos-bottom-left',
        'bottom-right': 'pos-bottom-right', 
        'top-left': 'pos-top-left',
        'top-right': 'pos-top-right'
      };
      return positions[this.config.position] || 'pos-bottom-right';
    },
    

    
    // Load CSS styles
    loadStyles: function() {
      if (document.getElementById('nowgray-widget-styles')) return;
      
      const css = \`
        .nowgray-widget-container * { box-sizing: border-box; }
        
        .nowgray-widget {
          position: fixed;
          z-index: 999999;
          font-family: \${this.config.fontFamily || 'Inter, system-ui, sans-serif'};
        }
        
        .nowgray-widget.pos-bottom-left { bottom: 20px; left: 20px; }
        .nowgray-widget.pos-bottom-right { bottom: 20px; right: 20px; }
        .nowgray-widget.pos-top-left { top: 20px; left: 20px; }
        .nowgray-widget.pos-top-right { top: 20px; right: 20px; }
        
        .nowgray-chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, \${this.config.primaryColor} 0%, \${this.config.secondaryColor} 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: all 0.3s ease;
        }
        
        .nowgray-chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }
        
        .nowgray-chat-window {
          position: absolute;
          width: 420px;
          height: 650px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: nowgray-slide-up 0.3s ease-out;
        }
        
        .pos-bottom-left .nowgray-chat-window,
        .pos-bottom-right .nowgray-chat-window {
          bottom: 80px;
        }
        
        .pos-top-left .nowgray-chat-window,
        .pos-top-right .nowgray-chat-window {
          top: 80px;
        }
        
        .pos-bottom-left .nowgray-chat-window,
        .pos-top-left .nowgray-chat-window {
          left: 0;
        }
        
        .pos-bottom-right .nowgray-chat-window,
        .pos-top-right .nowgray-chat-window {
          right: 0;
        }
        
        .nowgray-chat-header {
          background: linear-gradient(135deg, \${this.config.primaryColor} 0%, \${this.config.secondaryColor} 100%);
          color: white;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .nowgray-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .nowgray-history-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          font-size: 14px;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .nowgray-history-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }
        
        .nowgray-new-chat-btn {
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .nowgray-new-chat-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: rotate(180deg);
        }
        
        .nowgray-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .nowgray-status-indicator {
          width: 8px;
          height: 8px;
          background: #00ff88;
          border-radius: 50%;
          animation: nowgray-pulse 2s infinite;
        }
        
        .nowgray-header-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .nowgray-header-text p {
          margin: 0;
          font-size: 12px;
          opacity: 0.9;
        }
        
        .nowgray-close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: background 0.2s;
        }
        
        .nowgray-close-btn:hover {
          background: rgba(255,255,255,0.2);
        }
        
        .nowgray-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: linear-gradient(to bottom, #f8fafc, #ffffff);
        }
        
        .nowgray-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 40px;
          color: #666;
          flex-direction: column;
        }
        
        .nowgray-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid \${this.config.primaryColor};
          border-radius: 50%;
          animation: nowgray-spin 1s linear infinite;
        }
        
        .nowgray-message {
          margin: 10px 0;
          display: flex;
        }
        
        .nowgray-message.user {
          justify-content: flex-end;
        }
        
        .nowgray-message.bot {
          justify-content: flex-start;
        }
        
        .nowgray-message.system {
          justify-content: center;
          margin: 15px 0;
        }
        
        .nowgray-message-content {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          position: relative;
        }
        
        .nowgray-message-reactions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .nowgray-message:hover .nowgray-message-reactions {
          opacity: 1;
        }
        
        .nowgray-reaction-btn {
          background: rgba(255,255,255,0.9);
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .nowgray-reaction-btn:hover {
          background: \${this.config.primaryColor};
          color: white;
          border-color: \${this.config.primaryColor};
        }
        
        .nowgray-quick-replies {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 15px 0;
          padding: 0 20px;
        }
        
        .nowgray-quick-reply-btn {
          background: rgba(59, 130, 246, 0.1);
          color: \${this.config.primaryColor};
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        .nowgray-quick-reply-btn:hover {
          background: \${this.config.primaryColor};
          color: white;
          transform: translateY(-1px);
        }
        

        
        .nowgray-typing-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #f1f5f9;
          border-radius: 18px;
          margin: 10px 0;
          font-size: 13px;
          color: #64748b;
        }
        
        .nowgray-session-separator {
          display: flex;
          align-items: center;
          margin: 20px 0;
          opacity: 0.7;
        }
        
        .nowgray-separator-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(to right, transparent, #ddd, transparent);
        }
        
        .nowgray-separator-text {
          padding: 0 15px;
          font-size: 12px;
          color: #888;
          background: #f8fafc;
          border-radius: 12px;
          padding: 4px 12px;
          white-space: nowrap;
        }
        
        .nowgray-load-more-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 15px;
          color: #666;
          font-size: 13px;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 8px;
          margin: 10px 0;
        }
        
        .nowgray-history-end {
          display: flex;
          align-items: center;
          margin: 15px 0;
          opacity: 0.5;
        }
        
        .nowgray-typing-dots {
          display: flex;
          gap: 3px;
        }
        
        .nowgray-typing-dot {
          width: 6px;
          height: 6px;
          background: \${this.config.primaryColor};
          border-radius: 50%;
          animation: nowgray-typing 1.5s infinite;
        }
        
        .nowgray-typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .nowgray-typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        .nowgray-message-timestamp {
          font-size: 10px;
          opacity: 0.7;
          margin-top: 4px;
          display: block;
        }
        
        .nowgray-message.user .nowgray-message-content {
          background: linear-gradient(135deg, \${this.config.primaryColor} 0%, \${this.config.secondaryColor} 100%);
          color: white;
          border-bottom-right-radius: 4px;
        }
        
        .nowgray-message.bot .nowgray-message-content {
          background: #f1f5f9;
          color: #334155;
          border-bottom-left-radius: 4px;
        }
        
        .nowgray-input-area {
          padding: 20px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }
        
        .nowgray-input-container {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .nowgray-input-container input {
          flex: 1;
          border: 1px solid #d1d5db;
          border-radius: 25px;
          padding: 12px 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .nowgray-input-container input:focus {
          border-color: \${this.config.primaryColor};
        }
        
        .nowgray-input-container button {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 50%;
          background: linear-gradient(135deg, \${this.config.primaryColor} 0%, \${this.config.secondaryColor} 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        }
        
        .nowgray-input-container button:hover {
          transform: scale(1.1);
        }
        
        @keyframes nowgray-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes nowgray-spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes nowgray-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes nowgray-typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-10px); opacity: 1; }
        }
        
        @media (max-width: 640px) {
          .nowgray-chat-window {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: auto !important;
            right: auto !important;
          }
        }
      \`;
      
      const style = document.createElement('style');
      style.id = 'nowgray-widget-styles';
      style.textContent = css;
      document.head.appendChild(style);
    },
    
    // Toggle chat window
    toggleChat: function() {
      const chatWindow = document.getElementById('nowgray-chat-window');
      this.isOpen = !this.isOpen;
      chatWindow.style.display = this.isOpen ? 'flex' : 'none';
      
      if (this.isOpen && this.messages.length === 0) {
        this.loadChatHistory();
      }
    },
    
    // Check chat history and load or show form
    loadChatHistory: async function() {
      try {
        // First try to load chat history for this company
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/search/history?companyId=\${this.config.companyId}&page=1&limit=20\`);
        const data = await response.json();
        
        if (data.success && data.data.messages && data.data.messages.length > 0) {
          // Has chat history - load it and process sessions
          this.messages = this.groupMessagesBySessions(data.data.messages);
          this.currentSessionId = data.data.currentSessionId;
          
          // Enhance the last bot message with features if it doesn't have them
          const lastMessage = this.messages[this.messages.length - 1];
          if (lastMessage && lastMessage.type === 'bot' && !lastMessage.quickReplies) {
            lastMessage.quickReplies = [
              'What else can you help with?',
              'How can I contact you?',
              'Tell me more about your services'
            ];
          }
          
          this.renderMessages();
          
          // Also check session for visitor info
          try {
            const sessionResponse = await fetch(\`\${this.config.apiUrl}/api/widget/session/check\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companyId: this.config.companyId,
                sessionDurationMinutes: 120
              })
            });
            
            const sessionData = await sessionResponse.json();
            if (sessionData.success) {
              this.sessionToken = sessionData.data.sessionToken;
              if (sessionData.data.hasActiveSession && sessionData.data.visitorInfo) {
                this.visitorInfo = sessionData.data.visitorInfo;
              }
            }
          } catch (sessionError) {
            console.error('Session check error (non-critical):', sessionError);
          }
          
        } else {
          // No chat history - check for active session with visitor info first
          try {
            console.log('🔍 No chat history found, checking for active session...');
            const sessionResponse = await fetch(\`\${this.config.apiUrl}/api/widget/session/check\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                companyId: this.config.companyId,
                sessionDurationMinutes: 120
              })
            });
            
            const sessionData = await sessionResponse.json();
            console.log('📋 Session check response:', sessionData);
            
            if (sessionData.success) {
              this.sessionToken = sessionData.data.sessionToken;
              
              // Check if user has active session with visitor info (already registered)
              if (sessionData.data.hasActiveSession && 
                  sessionData.data.visitorInfo && 
                  sessionData.data.visitorInfo.email) {
                
                console.log('✅ Found active session with visitor info, skipping registration form');
                this.visitorInfo = sessionData.data.visitorInfo;
                
                // Skip registration form and show welcome message
                this.showWelcomeMessage();
                return;
              }
            }
          } catch (sessionError) {
            console.error('Session creation error:', sessionError);
          }
          
          // Show registration form only if no active session with visitor info
          console.log('📝 No active session with visitor info, showing registration form');
          this.showVisitorRegistrationForm();
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // On error, show registration form as fallback
        this.showVisitorRegistrationForm();
      }
      
      // Hide loading indicator
      const loading = document.getElementById('nowgray-loading');
      if (loading) loading.style.display = 'none';
    },

    // Group messages by sessions for better display
    groupMessagesBySessions: function(messages) {
      if (!messages || messages.length === 0) return [];
      
      const sessions = {};
      const sessionOrder = [];
      
      // Group messages by sessionId or timestamp proximity
      messages.forEach(message => {
        const sessionKey = message.sessionId || 'default';
        if (!sessions[sessionKey]) {
          sessions[sessionKey] = [];
          sessionOrder.push(sessionKey);
        }
        sessions[sessionKey].push(message);
      });
      
      // Create grouped messages with session separators
      const groupedMessages = [];
      
      sessionOrder.forEach((sessionKey, sessionIndex) => {
        const sessionMessages = sessions[sessionKey];
        if (sessionMessages.length === 0) return;
        
        // Add session separator if this is not the first session
        if (sessionIndex > 0) {
          const firstMessage = sessionMessages[0];
          const sessionDate = new Date(firstMessage.timestamp);
          groupedMessages.push({
            id: \`session-separator-\${sessionKey}\`,
            type: 'session-separator',
            content: \`Previous conversation from \${this.formatDate(sessionDate)}\`,
            timestamp: firstMessage.timestamp,
            sessionId: sessionKey
          });
        }
        
        // Add all messages from this session
        sessionMessages.forEach(message => {
          groupedMessages.push(message);
        });
      });
      
      return groupedMessages;
    },

    // Format date for session separators
    formatDate: function(date) {
      const now = new Date();
      const messageDate = new Date(date);
      const diffTime = now - messageDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'earlier today';
      } else if (diffDays === 1) {
        return 'yesterday';
      } else if (diffDays < 7) {
        return \`\${diffDays} days ago\`;
      } else {
        return messageDate.toLocaleDateString();
      }
    },

    // Setup scroll handlers for loading more history
    setupScrollHandlers: function() {
      const messagesContainer = document.getElementById('nowgray-messages');
      if (!messagesContainer) return;
      
      let isLoadingMore = false;
      let currentPage = 1;
      let hasMoreHistory = true;
      
      messagesContainer.addEventListener('scroll', async () => {
        // Check if scrolled to top and can load more
        if (messagesContainer.scrollTop === 0 && !isLoadingMore && hasMoreHistory) {
          isLoadingMore = true;
          currentPage++;
          
          try {
            await this.loadMoreHistory(currentPage);
          } catch (error) {
            console.error('Error loading more history:', error);
            hasMoreHistory = false;
          } finally {
            isLoadingMore = false;
          }
        }
      });
    },

    // Load more chat history (pagination)
    loadMoreHistory: async function(page = 2) {
      try {
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/search/history?companyId=\${this.config.companyId}&page=\${page}&limit=20\`);
        const data = await response.json();
        
        if (data.success && data.data.messages && data.data.messages.length > 0) {
          // Show loading indicator at top
          const messagesContainer = document.getElementById('nowgray-messages');
          const loadingHtml = \`
            <div id="nowgray-load-more-indicator" class="nowgray-load-more-indicator">
              <div class="nowgray-spinner"></div>
              <span>Loading more history...</span>
            </div>
          \`;
          messagesContainer.insertAdjacentHTML('afterbegin', loadingHtml);
          
          // Store current scroll height
          const oldScrollHeight = messagesContainer.scrollHeight;
          
          // Process and prepend older messages
          const olderMessages = this.groupMessagesBySessions(data.data.messages);
          this.messages = [...olderMessages, ...this.messages];
          
          // Remove loading indicator and re-render
          setTimeout(() => {
            const loadingIndicator = document.getElementById('nowgray-load-more-indicator');
            if (loadingIndicator) loadingIndicator.remove();
            
            this.renderMessages();
            
            // Maintain scroll position
            const newScrollHeight = messagesContainer.scrollHeight;
            messagesContainer.scrollTop = newScrollHeight - oldScrollHeight;
          }, 500);
          
          // Check if there's more history available
          if (!data.data.pagination.hasMore) {
            // Add "end of history" indicator
            setTimeout(() => {
              const endOfHistoryHtml = \`
                <div class="nowgray-history-end">
                  <div class="nowgray-separator-line"></div>
                  <div class="nowgray-separator-text">📜 Beginning of conversation history</div>
                  <div class="nowgray-separator-line"></div>
                </div>
              \`;
              messagesContainer.insertAdjacentHTML('afterbegin', endOfHistoryHtml);
            }, 600);
            return false; // No more history
          }
          
          return true; // More history available
        }
      } catch (error) {
        console.error('Error loading more history:', error);
        return false;
      }
    },
    
    // Show welcome message
    showWelcomeMessage: function() {
      const welcomeMessage = {
        id: 'welcome',
        type: 'bot',
        content: 'Hello! 👋 Welcome to our AI assistant. How can I help you today?',
        timestamp: new Date().toISOString(),

        quickReplies: [
          'What services do you offer?',
          'How much does it cost?',
          'How can I contact you?'
        ]
      };
      this.messages = [welcomeMessage];
      this.renderMessages();
    },
    
    // Show welcome back message for returning visitors
    showWelcomeBackMessage: function() {
      const name = this.visitorInfo?.name || 'there';
      const welcomeMessage = {
        id: 'welcome-back',
        type: 'bot',
        content: \`Welcome back, \${name}! 👋 I'm glad to see you again. How can I assist you today?\`,
        timestamp: new Date().toISOString(),

        quickReplies: [
          'What is new?',
          'I need help with something',
          'Check my previous questions'
        ]
      };
      this.messages = [welcomeMessage];
      this.renderMessages();
    },
    
    // Show visitor registration form for new IPs
    showVisitorRegistrationForm: function() {
      const messagesContainer = document.getElementById('nowgray-messages');
      const loading = document.getElementById('nowgray-loading');
      
      if (loading) loading.style.display = 'none';
      
      messagesContainer.innerHTML = \`
        <div class="nowgray-visitor-form" style="
          padding: 30px 20px;
          text-align: center;
        ">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, \${this.config.primaryColor} 0%, \${this.config.secondaryColor} 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
          ">
            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          
          <h3 style="margin: 0 0 10px; color: #333; font-size: 20px;">Welcome! 👋</h3>
          <p style="margin: 0 0 25px; color: #666; font-size: 14px; line-height: 1.6;">
            Hi there! I'm your AI assistant for this company. To get started and provide you with personalized help, please share some basic information.
          </p>
          
          <form id="nowgray-visitor-form" style="space-y: 15px;">
            <div style="margin-bottom: 15px;">
              <input
                type="text"
                id="visitor-name"
                placeholder="Your Name"
                required
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 2px solid #e5e7eb;
                  border-radius: 12px;
                  font-size: 14px;
                  transition: border-color 0.2s;
                  outline: none;
                "
                onfocus="this.style.borderColor='#3b82f6'"
                onblur="this.style.borderColor='#e5e7eb'"
              />
            </div>
            
            <div style="margin-bottom: 15px;">
              <input
                type="email"
                id="visitor-email"
                placeholder="Email (Optional)"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 2px solid #e5e7eb;
                  border-radius: 12px;
                  font-size: 14px;
                  transition: border-color 0.2s;
                  outline: none;
                "
                onfocus="this.style.borderColor='#3b82f6'"
                onblur="this.style.borderColor='#e5e7eb'"
              />
            </div>
            
            <div style="margin-bottom: 15px;">
              <input
                type="tel"
                id="visitor-phone"
                placeholder="Phone (Optional)"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 2px solid #e5e7eb;
                  border-radius: 12px;
                  font-size: 14px;
                  transition: border-color 0.2s;
                  outline: none;
                "
                onfocus="this.style.borderColor='#3b82f6'"
                onblur="this.style.borderColor='#e5e7eb'"
              />
            </div>
            
            <div style="margin-bottom: 20px;">
              <select
                id="visitor-topic"
                style="
                  width: 100%;
                  padding: 12px 16px;
                  border: 2px solid #e5e7eb;
                  border-radius: 12px;
                  font-size: 14px;
                  background: white;
                  transition: border-color 0.2s;
                  outline: none;
                "
                onfocus="this.style.borderColor='#3b82f6'"
                onblur="this.style.borderColor='#e5e7eb'"
              >
                <option value="">What can I help you with?</option>
                <option value="General Information">General Information</option>
                <option value="Product Support">Product Support</option>
                <option value="Sales Inquiry">Sales Inquiry</option>
                <option value="Technical Help">Technical Help</option>
                <option value="Billing Question">Billing Question</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <button
              type="submit"
              style="
                width: 100%;
                background: linear-gradient(135deg, \${this.config.primaryColor} 0%, \${this.config.secondaryColor} 100%);
                color: white;
                border: none;
                padding: 14px 24px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
              "
              onmouseover="this.style.transform='translateY(-2px)'"
              onmouseout="this.style.transform='translateY(0)'"
            >
              🚀 Start Chatting
            </button>
          </form>
          
          <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            <p>⏰ Your session will be active for 2 hours</p>
            <p>🔒 Your information is secure and won't be shared</p>
          </div>
        </div>
      \`;
      
      // Add form submission handler
      const form = document.getElementById('nowgray-visitor-form');
      form.addEventListener('submit', (e) => this.handleVisitorRegistration(e));
    },
    
    // Handle visitor registration form submission
    handleVisitorRegistration: async function(e) {
      e.preventDefault();
      
      const name = document.getElementById('visitor-name').value;
      const email = document.getElementById('visitor-email').value;
      const phone = document.getElementById('visitor-phone').value;
      const topic = document.getElementById('visitor-topic').value;
      
      if (!name) {
        alert('Please enter your name to continue.');
        return;
      }
      
      try {
        // Show loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Registering...';
        submitBtn.disabled = true;
        
        // Register visitor
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/session/register\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: this.sessionToken,
            visitorName: name,
            visitorEmail: email,
            visitorPhone: phone,
            topic: topic,
            companyId: this.config.companyId
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          this.visitorInfo = data.data.visitorInfo;
          
          // Show enhanced welcome message with new features
          const welcomeMessage = {
            id: 'registration-welcome',
            type: 'bot',
            content: \`Hello \${name}! 👋 Thank you for providing your information. I'm here to help you\${topic ? \` with \${topic.toLowerCase()}\` : ''}. What questions do you have for me?\`,
            timestamp: new Date().toISOString(),
    
            quickReplies: [
              'What services do you offer?',
              'How much does it cost?',
              'How can I contact you?'
            ]
          };
          this.messages = [welcomeMessage];
          this.renderMessages();
          
        } else {
          throw new Error(data.message || 'Registration failed');
        }
      } catch (error) {
        console.error('Error registering visitor:', error);
        alert('Sorry, there was an issue registering your information. Please try again.');
        
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = '🚀 Start Chatting';
        submitBtn.disabled = false;
      }
    },
    
    // Show welcome message for returning users
    showWelcomeMessage: function() {
      console.log('🎉 Showing welcome message for returning user:', this.visitorInfo);
      
      const messagesContainer = document.getElementById('nowgray-messages');
      const loading = document.getElementById('nowgray-loading');
      
      if (loading) loading.style.display = 'none';
      
      // Create welcome message for returning user
      const welcomeMessage = {
        id: 'returning-user-welcome',
        type: 'bot',
        content: \`Welcome back, \${this.visitorInfo.name || 'there'}! 👋 
        
I remember you from our previous conversation. How can I help you today?\`,
        timestamp: new Date().toISOString(),
        quickReplies: [
          'Continue our conversation',
          'I have a new question',
          'Contact information',
          'Your services'
        ]
      };
      
      this.messages = [welcomeMessage];
      this.renderMessages();
    },
    
    // Render messages
    renderMessages: function() {
      const messagesContainer = document.getElementById('nowgray-messages');
      const loading = document.getElementById('nowgray-loading');
      
      if (loading) loading.style.display = 'none';
      
      let html = '';
      
      this.messages.forEach((message, index) => {
        if (message.type === 'session-separator') {
          // Render session separator
          html += \`
            <div class="nowgray-session-separator">
              <div class="nowgray-separator-line"></div>
              <div class="nowgray-separator-text">\${message.content}</div>
              <div class="nowgray-separator-line"></div>
            </div>
          \`;
        } else if (message.type === 'system') {
          // Render system message (like history header)
          html += \`
            <div class="nowgray-message system">
              <div class="nowgray-separator-text" style="background: #e3f2fd; color: #1976d2; font-weight: 600;">
                \${message.content}
              </div>
            </div>
          \`;
        } else {
          // Render regular message
          html += \`
            <div class="nowgray-message \${message.type}" data-message-id="\${message.id || index}">
              <div class="nowgray-message-content">
                \${message.content}
                <span class="nowgray-message-timestamp">
                  \${new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                \${message.type === 'bot' ? \`
                  <div class="nowgray-message-reactions">
                    <button class="nowgray-reaction-btn" onclick="NowgrayChatWidget.reactToMessage('\${message.id || index}', 'helpful')">
                      👍 Helpful
                    </button>
                    <button class="nowgray-reaction-btn" onclick="NowgrayChatWidget.reactToMessage('\${message.id || index}', 'not_helpful')">
                      👎 Not helpful
                    </button>
                  </div>
                \` : ''}
              </div>
            </div>
          \`;
        }
      });
      
      // Add quick replies for the last bot message
      const lastMessage = this.messages[this.messages.length - 1];
      if (lastMessage && lastMessage.type === 'bot' && lastMessage.quickReplies && lastMessage.quickReplies.length > 0) {
        html += \`
          <div class="nowgray-quick-replies">
            \${lastMessage.quickReplies.map(reply => \`
              <button class="nowgray-quick-reply-btn" onclick="NowgrayChatWidget.sendQuickReply('\${reply}')">
                \${reply}
              </button>
            \`).join('')}
          </div>
        \`;
      }
      
      messagesContainer.innerHTML = html;
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    // Handle key press
    handleKeyPress: function(event) {
      if (event.key === 'Enter') {
        this.sendMessage();
      }
    },
    
    // Send message
    sendMessage: async function(messageText = null, isQuickReply = false) {
      const input = document.getElementById('nowgray-message-input');
      const message = messageText || input.value.trim();
      
      if (!message) return;
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      this.messages.push(userMessage);
      if (!messageText) input.value = '';
      this.renderMessages();
      
      // Show typing indicator
      this.showTypingIndicator();
      
      try {
        // Use enhanced chat endpoint
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/enhanced-chat/message\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            companyId: this.config.companyId,
            sessionId: this.currentSessionId,
            sessionToken: this.sessionToken,
            quickReply: isQuickReply
          })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        this.hideTypingIndicator();
        
        if (data.success) {
          const botMessage = {
            id: data.data.messageId || Date.now() + 2,
            type: 'bot',
            content: data.data.response,
            timestamp: data.data.timestamp,
            confidence: data.data.confidence,
            sources: data.data.sources,
            suggestedActions: data.data.suggestedActions,
            quickReplies: data.data.quickReplies
          };
          
          this.messages.push(botMessage);
          this.currentSessionId = data.data.sessionId;
        } else {
          throw new Error(data.message || 'Enhanced chat response failed');
        }
      } catch (error) {
        console.error('Enhanced chat error:', error);
        this.hideTypingIndicator();
        
        const errorMessage = {
          id: Date.now() + 2,
          type: 'bot',
          content: "I'm sorry, I'm having trouble connecting right now. Please try again. 🔄",
          timestamp: new Date().toISOString(),
          suggestedActions: ['Try again', 'Contact support']
        };
        this.messages.push(errorMessage);
      }
      
      this.renderMessages();
    },
    
    // Show typing indicator
    showTypingIndicator: function() {
      const messagesContainer = document.getElementById('nowgray-messages');
      const typingHtml = \`
        <div id="nowgray-typing-indicator" class="nowgray-typing-indicator">
          <div class="nowgray-typing-dots">
            <div class="nowgray-typing-dot"></div>
            <div class="nowgray-typing-dot"></div>
            <div class="nowgray-typing-dot"></div>
          </div>
          <span>AI is thinking...</span>
        </div>
      \`;
      messagesContainer.insertAdjacentHTML('beforeend', typingHtml);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    // Hide typing indicator
    hideTypingIndicator: function() {
      const typingIndicator = document.getElementById('nowgray-typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
    },
    
    // Send quick reply
    sendQuickReply: function(replyText) {
      this.sendMessage(replyText, true);
    },
    
    // React to message
    reactToMessage: async function(messageId, reaction) {
      try {
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/enhanced-chat/reaction\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId,
            reaction,
            sessionToken: this.sessionToken
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Show feedback
          this.showFeedback(data.data.message);
          
          // Update reaction button state
          const messageEl = document.querySelector(\`[data-message-id="\${messageId}"]\`);
          if (messageEl) {
            const reactionBtns = messageEl.querySelectorAll('.nowgray-reaction-btn');
            reactionBtns.forEach(btn => {
              btn.style.opacity = '0.5';
              btn.disabled = true;
            });
          }
        }
      } catch (error) {
        console.error('Reaction error:', error);
      }
    },
    
    // Handle suggested actions
    handleAction: function(action) {
      switch (action.toLowerCase()) {
        case 'contact support':
        case 'speak to human agent':
          this.sendMessage("I would like to speak with a human agent");
          break;
        case 'ask another question':
          const input = document.getElementById('nowgray-message-input');
          input.focus();
          break;
        case 'was this helpful?':
          // Already handled by reaction buttons
          break;
        default:
          this.sendMessage(action);
      }
    },
    
    // Show feedback message
    showFeedback: function(message) {
      // Create temporary feedback element
      const feedback = document.createElement('div');
      feedback.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: \${this.config.primaryColor};
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        font-size: 14px;
        z-index: 1000000;
        animation: nowgray-slide-in 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      \`;
      feedback.textContent = message;
      
      document.body.appendChild(feedback);
      
      // Remove after 3 seconds
      setTimeout(() => {
        feedback.remove();
      }, 3000);
    },
    
    // Store message
    storeMessage: async function(messageType, content) {
      try {
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/search/message\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageType,
            content,
            companyId: this.config.companyId,
            sessionId: this.currentSessionId
          })
        });
        
        const data = await response.json();
        if (data.success) {
          this.currentSessionId = data.data.sessionId;
        }
        
        // Update session activity
        if (this.sessionToken) {
          this.updateSessionActivity();
        }
      } catch (error) {
        console.error('Error storing message:', error);
      }
    },
    
    // Update session activity
    updateSessionActivity: async function() {
      try {
        await fetch(\`\${this.config.apiUrl}/api/widget/session/activity\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: this.sessionToken
          })
        });
      } catch (error) {
        console.error('Error updating session activity:', error);
      }
    },
    
    // Start new chat
    startNewChat: function() {
      // Clear current messages
      this.messages = [];
      this.currentSessionId = null;
      
      // Show enhanced welcome message with all features
      const welcomeMessage = {
        id: 'new-chat-welcome',
        type: 'bot',
        content: 'Hello! 👋 I am your AI assistant. I am here to help you with any questions you might have. How can I assist you today?',
        timestamp: new Date().toISOString(),

        quickReplies: [
          'What services do you offer?',
          'How much does it cost?',
          'How can I contact you?',
          'What are your business hours?',
          'Tell me about your company'
        ]
      };
      
      this.messages = [welcomeMessage];
      this.renderMessages();
      
      // Show success feedback
      this.showFeedback('New chat started! 🎉');
    },

    // Toggle history view
    toggleHistoryView: async function() {
      try {
        this.showFeedback('Loading chat history...');
        
        // Load more comprehensive history
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/search/history?companyId=\${this.config.companyId}&page=1&limit=50\`);
        const data = await response.json();
        
        if (data.success && data.data.messages && data.data.messages.length > 0) {
          // Show history with session separators
          this.messages = this.groupMessagesBySessions(data.data.messages);
          this.currentSessionId = data.data.currentSessionId;
          
          // Add a header to indicate this is history view
          const historyHeader = {
            id: 'history-header',
            type: 'system',
            content: '📜 Complete Chat History',
            timestamp: new Date().toISOString()
          };
          
          this.messages.unshift(historyHeader);
          this.renderMessages();
          
          this.showFeedback(\`Loaded \${data.data.messages.length} messages from your chat history\`);
        } else {
          this.showFeedback('No chat history found. Start a conversation to build your history!');
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        this.showFeedback('Unable to load chat history. Please try again.');
      }
    }
  };

  // Auto-initialize when script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.NowgrayChatWidget.init();
    });
  } else {
    window.NowgrayChatWidget.init();
  }

})();`;
}

// Routes
router.get('/script', getWidgetScript);
router.get('/config', getWidgetConfig);

module.exports = router;
