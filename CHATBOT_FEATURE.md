# 🤖 Company-Wise Chatbot Feature

## Overview
This feature adds a company-specific chatbot that appears as a fixed robot icon at the bottom of the screen. When clicked, it opens a full-screen chat interface in an aside panel.

## ✨ Features

### 🎯 **Fixed Robot Icon**
- **Always visible** at bottom-right corner of the screen
- **Animated bouncing** effect to attract attention
- **Pulse animation** with blue glow
- **Hover effects** with scale and rotation
- **AI badge** indicator on top-right corner
- **Tooltip** on hover showing "Chat with AI Assistant"

### 💬 **Full-Screen Chat Interface**
- **Slides in from right** with smooth animation
- **Company-specific** responses based on company ID
- **Smooth typing animation** with natural pauses
- **Loading indicators** with animated dots
- **Message history** with timestamps
- **Professional design** with gradient header

### 🎨 **Animations & Effects**
- **Bounce animation** for the robot icon
- **Pulse effect** for attention
- **Slide-in animation** for chat panel
- **Fade-in overlay** for background
- **Typing dots** with staggered animation
- **Message slide-in** effects
- **Hover transformations** with 3D effects

## 🚀 How to Use

### 1. **Access the Chatbot**
- The robot icon appears automatically on all company admin pages
- Click the bouncing robot icon to open the chat

### 2. **Test the Chatbot**
- Go to **Widget Management** page
- Click **"Preview Widget"** or **"Test Chat"** buttons
- The robot icon will appear at the bottom

### 3. **Chat Interface**
- **Welcome message** appears automatically
- **Type your question** in the input field
- **Watch AI respond** with smooth typing animation
- **Natural pauses** at punctuation marks
- **Close chat** using the X button

## 🔧 Technical Implementation

### **Components Created:**
1. **`FixedChatbotIcon.js`** - The bouncing robot icon
2. **`CompanyChatbot.js`** - The full-screen chat interface
3. **CSS animations** in `index.css`

### **Integration Points:**
- **CompanyAdminLayout** - Shows chatbot on all admin pages
- **WidgetManagement** - Test/preview functionality
- **API integration** with `/api/widget/search/ai/public`

### **State Management:**
```javascript
const [showChatbot, setShowChatbot] = useState(false);
const [showFixedIcon, setShowFixedIcon] = useState(true);
```

## 🎯 **Key Features**

### **Company-Specific Responses**
- Uses `companyId` from localStorage
- Connects to company-specific FAQ database
- Personalized responses based on company data

### **Smooth Animations**
- **35ms base typing speed**
- **200ms pause** at sentence endings
- **100ms pause** at punctuation
- **25ms for spaces**
- **300ms initial delay**

### **Professional UX**
- **Loading states** with animated dots
- **Error handling** with fallback messages
- **Auto-scroll** to latest messages
- **Responsive design** for all screen sizes

## 📱 **Responsive Design**
- **Desktop**: Full-width aside panel
- **Tablet**: Optimized layout
- **Mobile**: Full-screen experience
- **Touch-friendly** buttons and interactions

## 🎨 **Visual Design**
- **Blue gradient** theme matching the app
- **Modern chat bubbles** with rounded corners
- **Professional typography** and spacing
- **Smooth transitions** and hover effects
- **Consistent branding** throughout

## 🔌 **API Integration**
```javascript
// Endpoint used
GET /api/widget/search/ai/public?query={question}&companyId={companyId}

// Example usage
const response = await fetch(`/api/widget/search/ai/public?query=${encodeURIComponent(content)}&limit=5&companyId=${companyId || 6}`);
```

## 🚨 **Error Handling**
- **Network errors** show fallback message
- **API failures** gracefully handled
- **Loading states** prevent multiple requests
- **User feedback** for all interactions

## 🎉 **Ready to Use!**

The company-wise chatbot is now fully integrated and provides:
- **Instant access** to AI assistance
- **Company-specific** responses
- **Professional user experience**
- **Smooth animations** and interactions
- **Responsive design** for all devices

Users can now get immediate help with company-specific questions through the animated robot icon that's always available at the bottom of the screen!
