# 🤖 AI Chat Widget - Embed Guide

## Overview
This is a fully functional AI-powered chat widget that can be embedded in any website. The widget features smooth typing animations, quick question buttons, and intelligent responses based on your FAQ knowledge base.

## ✨ Features

### 🎯 **Smooth Typing Animation**
- AI responses appear word by word with natural pauses
- Longer pauses at sentence endings (200ms for `.`, `!`, `?`)
- Medium pauses for punctuation (100ms for `,`, `;`, `:`)
- Faster typing for spaces (25ms)
- Base typing speed of 35ms per character

### 💬 **Quick Question Buttons**
- 6 pre-defined question buttons in blue
- Questions disappear during AI responses
- Reappear after response is complete
- One-click answers to common questions

### 🎨 **Beautiful Design**
- Modern, responsive design
- Smooth animations and transitions
- Professional chat interface
- Works on all devices

### ⚡ **Real-time Interaction**
- Instant loading indicators
- Smooth message flow
- Auto-scroll to latest messages
- Professional user experience

## 🚀 Quick Start

### 1. Start the Servers
```bash
# Start the backend server (in server directory)
cd server
npm start

# Start the frontend server (in client directory)
cd client
npm start
```

### 2. Test the Widget
Open your browser and go to:
```
http://localhost:3000/test-widget.html
```

### 3. Embed in Your Website
Add this single line of code to your HTML:

```html
<script src="http://localhost:3000/widget.js" data-widget-id="widget_123" data-company-id="6"></script>
```

## 🔧 Configuration Options

The widget can be customized using data attributes:

```html
<script 
  src="http://localhost:3000/widget.js" 
  data-widget-id="your-widget-id"
  data-company-id="6"
  data-theme="light"
  data-position="bottom-right"
  data-primary-color="#3b82f6"
></script>
```

### Available Options:
- `data-widget-id`: Unique identifier for your widget
- `data-company-id`: Company ID for FAQ filtering (default: 6)
- `data-theme`: Widget theme (light/dark)
- `data-position`: Widget position (bottom-right, bottom-left, top-right, top-left)
- `data-primary-color`: Primary color in hex format

## 📝 Sample Questions

The widget comes with 6 pre-defined questions:
1. "What services do you offer?"
2. "How can I contact support?"
3. "What are your business hours?"
4. "How do I get started?"
5. "What is Blinkit?"
6. "How are orders managed?"

## 🎯 How It Works

### 1. **User Interaction**
- User clicks the chat button in bottom-right corner
- Widget opens with welcome message and quick question buttons

### 2. **Question Selection**
- User can click a quick question button OR type their own question
- Quick questions disappear during AI processing

### 3. **AI Processing**
- Loading indicator shows "Searching for answers..."
- Widget calls the AI API with the question

### 4. **Response Display**
- AI response appears with smooth typing animation
- Natural pauses at punctuation marks
- Quick questions reappear after response

### 5. **Continuous Chat**
- User can continue asking questions
- Full conversation history maintained
- Smooth, natural conversation flow

## 🔌 API Integration

The widget connects to your backend API at:
```
GET /api/widget/search/ai/public?query={question}&companyId={companyId}
```

### API Requirements:
- Backend server running on `localhost:5000`
- FAQ data in database for company ID 6
- OpenAI API key configured

## 🎨 Customization

### Colors
The widget uses your primary color for:
- Chat button background
- User message bubbles
- Quick question buttons
- Header gradient

### Styling
All styles are self-contained and won't conflict with your website's CSS.

## 📱 Responsive Design

The widget is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🛠️ Development

### File Structure:
```
client/public/
├── widget.js          # Main widget script
└── test-widget.html   # Demo page
```

### Key Features:
- Self-contained JavaScript
- No external dependencies
- Automatic initialization
- Error handling
- Loading states

## 🚨 Troubleshooting

### Widget Not Loading?
1. Check that both servers are running
2. Verify the script URL is correct
3. Check browser console for errors

### No AI Responses?
1. Ensure backend server is running on port 5000
2. Check that FAQs exist for the specified company ID
3. Verify OpenAI API key is configured

### Styling Issues?
1. Widget styles are self-contained
2. Check for CSS conflicts with your website
3. Verify the primary color is in hex format

## 📞 Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all servers are running correctly
3. Test with the demo page first

## 🎉 Ready to Use!

Your AI chat widget is now ready to provide intelligent, engaging customer support with smooth typing animations and professional user experience!
