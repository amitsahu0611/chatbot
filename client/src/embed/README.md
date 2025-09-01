# 🚀 Nowgray Embeddable Chat Widget

Transform any website into an AI-powered customer support platform with our easy-to-integrate chat widget.

## ✨ Features

- 🤖 **AI-Powered Responses** - Smart chatbot with FAQ integration
- ⚡ **Easy Integration** - Just one script tag to get started
- 🎨 **Fully Customizable** - Match your brand colors and styling
- 📱 **Responsive Design** - Works perfectly on all devices
- 🔧 **API Control** - Programmatic widget management
- 💾 **Conversation History** - Persistent chat sessions
- 📊 **Lead Capture** - Built-in form for collecting user information
- 🔍 **FAQ Suggestions** - Smart suggestions based on user input

## 🚀 Quick Start

### Method 1: Auto-Initialization (Recommended)

Add this script tag to your website:

```html
<script 
  src="https://your-domain.com/widget-loader.js"
  data-nowgray-company-id="YOUR_COMPANY_ID"
  data-nowgray-widget-id="YOUR_WIDGET_ID"
  data-nowgray-position="bottom-right"
  data-nowgray-primary-color="#667eea"
  data-nowgray-secondary-color="#764ba2"
></script>
```

### Method 2: Manual Initialization

For more control over the initialization process:

```html
<script src="https://your-domain.com/widget-loader.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    initNowgrayChatWidget({
      companyId: 'YOUR_COMPANY_ID',
      widgetId: 'YOUR_WIDGET_ID',
      position: 'bottom-right',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      apiUrl: 'https://api.your-domain.com',
      debug: false
    });
  });
</script>
```

## 📖 Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `companyId` | string | **Required** | Your unique company identifier |
| `widgetId` | string | `null` | Specific widget configuration ID |
| `position` | string | `'bottom-right'` | Widget position: `'bottom-right'`, `'bottom-left'`, `'top-right'`, `'top-left'` |
| `primaryColor` | string | `'#667eea'` | Primary brand color (hex format) |
| `secondaryColor` | string | `'#764ba2'` | Secondary brand color (hex format) |
| `fontFamily` | string | `'Inter, system-ui, sans-serif'` | Font family for the widget |
| `apiUrl` | string | `'http://localhost:5001'` | API endpoint URL |
| `theme` | string | `'default'` | Widget theme (future feature) |
| `debug` | boolean | `false` | Enable debug logging |

## 🎛️ Widget Control API

Once the widget is loaded, you can control it programmatically:

### Show/Hide Widget

```javascript
// Show the widget
NowgrayChatWidget.show();

// Hide the widget
NowgrayChatWidget.hide();

// Toggle widget visibility
NowgrayChatWidget.toggle();
```

### Update Configuration

```javascript
// Update widget styling
NowgrayChatWidget.updateConfig({
  primaryColor: '#ff6b6b',
  secondaryColor: '#ee5a24',
  position: 'bottom-left'
});
```

### Destroy Widget

```javascript
// Completely remove the widget from the page
NowgrayChatWidget.destroy();
```

### Widget Status

```javascript
// Check if widget is loaded
console.log(NowgrayChatWidget.isLoaded); // true/false

// Get current configuration
console.log(NowgrayChatWidget.config);
```

## 📡 Events

Listen for widget events:

```javascript
// Widget loaded successfully
window.addEventListener('nowgray-widget-loaded', function(event) {
  console.log('Widget loaded with config:', event.detail.config);
});

// Custom event handling
document.addEventListener('nowgray-chat-opened', function() {
  console.log('Chat window opened');
});

document.addEventListener('nowgray-chat-closed', function() {
  console.log('Chat window closed');
});
```

## 🎨 Customization Examples

### Brand Color Schemes

```javascript
// Tech Blue
NowgrayChatWidget.updateConfig({
  primaryColor: '#3b82f6',
  secondaryColor: '#1e40af'
});

// Success Green
NowgrayChatWidget.updateConfig({
  primaryColor: '#10b981',
  secondaryColor: '#059669'
});

// Warning Orange
NowgrayChatWidget.updateConfig({
  primaryColor: '#f59e0b',
  secondaryColor: '#d97706'
});

// Elegant Purple
NowgrayChatWidget.updateConfig({
  primaryColor: '#8b5cf6',
  secondaryColor: '#7c3aed'
});
```

### Position Examples

```javascript
// Bottom right (default)
NowgrayChatWidget.updateConfig({ position: 'bottom-right' });

// Bottom left
NowgrayChatWidget.updateConfig({ position: 'bottom-left' });

// Top right
NowgrayChatWidget.updateConfig({ position: 'top-right' });

// Top left
NowgrayChatWidget.updateConfig({ position: 'top-left' });
```

## 📱 Responsive Behavior

The widget automatically adapts to different screen sizes:

- **Desktop**: Fixed position with configurable location
- **Tablet**: Optimized sizing for touch interaction
- **Mobile**: Full-screen overlay for better usability

## 🔧 Advanced Integration

### React Integration

```jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Load widget after component mounts
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget-loader.js';
    script.setAttribute('data-nowgray-company-id', 'YOUR_COMPANY_ID');
    script.setAttribute('data-nowgray-position', 'bottom-right');
    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (window.NowgrayChatWidget) {
        window.NowgrayChatWidget.destroy();
      }
    };
  }, []);

  return <div>Your React App</div>;
}
```

### Vue.js Integration

```vue
<template>
  <div>Your Vue App</div>
</template>

<script>
export default {
  mounted() {
    this.loadChatWidget();
  },
  beforeUnmount() {
    if (window.NowgrayChatWidget) {
      window.NowgrayChatWidget.destroy();
    }
  },
  methods: {
    loadChatWidget() {
      const script = document.createElement('script');
      script.src = 'https://your-domain.com/widget-loader.js';
      script.setAttribute('data-nowgray-company-id', 'YOUR_COMPANY_ID');
      document.head.appendChild(script);
    }
  }
};
</script>
```

### Angular Integration

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<div>Your Angular App</div>'
})
export class AppComponent implements OnInit, OnDestroy {
  
  ngOnInit() {
    this.loadChatWidget();
  }
  
  ngOnDestroy() {
    if ((window as any).NowgrayChatWidget) {
      (window as any).NowgrayChatWidget.destroy();
    }
  }
  
  private loadChatWidget() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget-loader.js';
    script.setAttribute('data-nowgray-company-id', 'YOUR_COMPANY_ID');
    document.head.appendChild(script);
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Widget not appearing**
   - Check that `companyId` is correctly set
   - Verify the script URL is accessible
   - Check browser console for errors

2. **Styling conflicts**
   - The widget uses isolated CSS with `nowgray-` prefixes
   - High z-index (999999) to stay above other elements
   - Custom CSS properties for easy theme overrides

3. **API connection issues**
   - Verify `apiUrl` is correct and accessible
   - Check CORS settings on your API server
   - Ensure API endpoints are available

### Debug Mode

Enable debug mode to see detailed logging:

```html
<script 
  src="https://your-domain.com/widget-loader.js"
  data-nowgray-debug="true"
></script>
```

Or programmatically:

```javascript
NowgrayChatWidget.updateConfig({ debug: true });
```

## 📊 Performance

The widget is optimized for performance:

- **Lazy Loading**: Dependencies loaded only when needed
- **Small Bundle**: Minimal JavaScript footprint
- **CDN Ready**: Optimized for global content delivery
- **Caching**: Efficient asset caching strategies

## 🔒 Security

- **HTTPS Only**: Production deployment requires HTTPS
- **CORS Protection**: Proper cross-origin resource sharing
- **Input Sanitization**: All user inputs are sanitized
- **XSS Prevention**: Protected against cross-site scripting

## 📈 Analytics

Track widget performance with built-in analytics:

```javascript
// Listen for analytics events
window.addEventListener('nowgray-analytics', function(event) {
  const { action, data } = event.detail;
  
  // Send to your analytics platform
  gtag('event', action, data);
  // or
  analytics.track(action, data);
});
```

## 🆘 Support

- 📧 **Email**: support@nowgray.com
- 📱 **Live Chat**: Use our own widget on nowgray.com
- 📖 **Documentation**: https://docs.nowgray.com
- 🐛 **Bug Reports**: https://github.com/nowgray/chat-widget/issues

## 📄 License

MIT License - see LICENSE file for details.

## 🚀 Getting Your Company ID

1. Sign up at [nowgray.com](https://nowgray.com)
2. Create a new company in your dashboard
3. Navigate to Widget Settings
4. Copy your Company ID and Widget ID
5. Configure your FAQs and AI responses
6. Deploy the widget on your website!

---

Made with ❤️ by the Nowgray team
