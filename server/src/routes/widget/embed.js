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

    // Set appropriate headers
    res.set({
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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
              <button class="nowgray-close-btn" onclick="NowgrayChatWidget.toggleChat()">×</button>
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
          width: 380px;
          height: 600px;
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
        
        .nowgray-message-content {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
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
          // Has chat history - load it
          this.messages = data.data.messages;
          this.currentSessionId = data.data.currentSessionId;
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
          // No chat history - show registration form for this company
          try {
            // Still create a session for tracking
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
            }
          } catch (sessionError) {
            console.error('Session creation error:', sessionError);
          }
          
          // Show registration form since no chat history exists
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
    
    // Show welcome message
    showWelcomeMessage: function() {
      const welcomeMessage = {
        id: 'welcome',
        type: 'bot',
        content: 'Hello! 👋 Welcome to our AI assistant. How can I help you today?',
        timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
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
                onfocus="this.style.borderColor='\${this.config.primaryColor}'"
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
                onfocus="this.style.borderColor='\${this.config.primaryColor}'"
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
                onfocus="this.style.borderColor='\${this.config.primaryColor}'"
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
                onfocus="this.style.borderColor='\${this.config.primaryColor}'"
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
              onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)'"
              onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.3)'"
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
          
          // Show welcome message
          const welcomeMessage = {
            id: 'registration-welcome',
            type: 'bot',
            content: \`Hello \${name}! 👋 Thank you for providing your information. I'm here to help you\${topic ? \` with \${topic.toLowerCase()}\` : ''}. What questions do you have for me?\`,
            timestamp: new Date().toISOString()
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
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    },
    
    // Render messages
    renderMessages: function() {
      const messagesContainer = document.getElementById('nowgray-messages');
      const loading = document.getElementById('nowgray-loading');
      
      if (loading) loading.style.display = 'none';
      
      messagesContainer.innerHTML = this.messages.map(message => \`
        <div class="nowgray-message \${message.type}">
          <div class="nowgray-message-content">
            \${message.content}
            <div style="font-size: 10px; opacity: 0.7; margin-top: 4px;">
              \${new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>
      \`).join('');
      
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
    sendMessage: async function() {
      const input = document.getElementById('nowgray-message-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      // Add user message
      const userMessage = {
        id: Date.now(),
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      this.messages.push(userMessage);
      input.value = '';
      this.renderMessages();
      
      // Store message
      await this.storeMessage('user', message);
      
      // Add loading message
      const loadingMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '<div class="nowgray-typing">AI is typing...</div>',
        timestamp: new Date().toISOString()
      };
      this.messages.push(loadingMessage);
      this.renderMessages();
      
      try {
        // Send to AI
        const response = await fetch(\`\${this.config.apiUrl}/api/widget/search/ai/public?query=\${encodeURIComponent(message)}&companyId=\${this.config.companyId}\`);
        const data = await response.json();
        
        // Remove loading message
        this.messages.pop();
        
        if (data.success) {
          const botMessage = {
            id: Date.now() + 2,
            type: 'bot',
            content: data.data.answer,
            timestamp: new Date().toISOString()
          };
          
          this.messages.push(botMessage);
          await this.storeMessage('bot', data.data.answer);
        } else {
          throw new Error(data.message || 'AI response failed');
        }
      } catch (error) {
        // Remove loading message
        this.messages.pop();
        
        const errorMessage = {
          id: Date.now() + 2,
          type: 'bot',
          content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date().toISOString()
        };
        this.messages.push(errorMessage);
        await this.storeMessage('bot', errorMessage.content);
      }
      
      this.renderMessages();
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
