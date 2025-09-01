// Nowgray Chat Widget Loader
// This script allows embedding the chat widget on any website
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.NowgrayChatWidget) {
    return;
  }

  // Widget configuration
  const DEFAULT_CONFIG = {
    apiUrl: 'http://localhost:5001', // Change this to your production API URL
    position: 'bottom-right',
    theme: 'default',
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    autoLoad: true,
    debug: false
  };

  // Global widget manager
  window.NowgrayChatWidget = {
    config: {},
    isLoaded: false,
    widget: null,
    
    // Initialize the widget
    init: function(config) {
      this.config = Object.assign({}, DEFAULT_CONFIG, config);
      
      if (this.config.debug) {
        console.log('🚀 Initializing Nowgray Chat Widget with config:', this.config);
      }
      
      // Validate required parameters
      if (!this.config.companyId) {
        console.error('❌ Nowgray Chat Widget: companyId is required');
        return;
      }
      
      // Load dependencies and render widget
      this.loadDependencies().then(() => {
        this.render();
      }).catch((error) => {
        console.error('❌ Failed to load Nowgray Chat Widget:', error);
      });
    },
    
    // Load required dependencies (React, ReactDOM)
    loadDependencies: function() {
      return new Promise((resolve, reject) => {
        // Check if React is already available
        if (window.React && window.ReactDOM) {
          if (this.config.debug) {
            console.log('✅ React dependencies already available');
          }
          resolve();
          return;
        }
        
        // Load React and ReactDOM from CDN
        const reactScript = document.createElement('script');
        reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
        reactScript.crossOrigin = 'anonymous';
        
        const reactDOMScript = document.createElement('script');
        reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
        reactDOMScript.crossOrigin = 'anonymous';
        
        let loadedCount = 0;
        const totalDeps = 2;
        
        function onLoad() {
          loadedCount++;
          if (loadedCount === totalDeps) {
            if (window.NowgrayChatWidget.config.debug) {
              console.log('✅ React dependencies loaded successfully');
            }
            resolve();
          }
        }
        
        function onError() {
          reject(new Error('Failed to load React dependencies'));
        }
        
        reactScript.onload = onLoad;
        reactScript.onerror = onError;
        reactDOMScript.onload = onLoad;
        reactDOMScript.onerror = onError;
        
        document.head.appendChild(reactScript);
        document.head.appendChild(reactDOMScript);
      });
    },
    
    // Load and inject CSS styles
    loadStyles: function() {
      // Check if styles are already injected
      if (document.getElementById('nowgray-chat-widget-styles')) {
        return;
      }
      
      const css = `
        /* Nowgray Chat Widget Styles */
        .nowgray-chat-widget-container {
          font-family: ${this.config.fontFamily};
          z-index: 999999 !important;
        }
        
        .nowgray-chat-widget-container * {
          box-sizing: border-box;
        }
        
        .nowgray-chat-button {
          cursor: pointer;
          user-select: none;
          border: none;
          outline: none;
        }
        
        .nowgray-chat-window {
          font-family: ${this.config.fontFamily};
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        /* Animations */
        @keyframes nowgray-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes nowgray-bounce {
          0%, 100% { 
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% { 
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        @keyframes nowgray-spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes nowgray-fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        @keyframes nowgray-slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-pulse { animation: nowgray-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-bounce { animation: nowgray-bounce 1s infinite; }
        .animate-spin { animation: nowgray-spin 1s linear infinite; }
        .animate-fade-in { animation: nowgray-fade-in 0.3s ease-out; }
        .animate-slide-up { animation: nowgray-slide-up 0.3s ease-out; }
        
        /* Responsive design */
        @media (max-width: 640px) {
          .nowgray-chat-window {
            width: 100vw !important;
            height: 100vh !important;
            max-width: none !important;
            border-radius: 0 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
          }
          
          .nowgray-chat-widget-container {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
      `;
      
      const style = document.createElement('style');
      style.id = 'nowgray-chat-widget-styles';
      style.textContent = css;
      document.head.appendChild(style);
    },
    
    // Render the widget
    render: function() {
      try {
        // Inject CSS
        this.loadStyles();
        
        // Create container element
        const container = document.createElement('div');
        container.id = 'nowgray-chat-widget-root';
        document.body.appendChild(container);
        
        // Create React element using the global React
        const widget = React.createElement(window.NowgrayEmbeddableChatWidget || EmbeddableChatWidget, {
          companyId: this.config.companyId,
          widgetId: this.config.widgetId,
          position: this.config.position,
          theme: this.config.theme,
          apiUrl: this.config.apiUrl,
          primaryColor: this.config.primaryColor,
          secondaryColor: this.config.secondaryColor,
          fontFamily: this.config.fontFamily
        });
        
        // Render using ReactDOM
        const root = ReactDOM.createRoot(container);
        root.render(widget);
        
        this.isLoaded = true;
        this.widget = widget;
        
        if (this.config.debug) {
          console.log('✅ Nowgray Chat Widget rendered successfully');
        }
        
        // Trigger custom event
        const event = new CustomEvent('nowgray-widget-loaded', {
          detail: { config: this.config }
        });
        window.dispatchEvent(event);
        
      } catch (error) {
        console.error('❌ Error rendering Nowgray Chat Widget:', error);
      }
    },
    
    // Destroy the widget
    destroy: function() {
      const container = document.getElementById('nowgray-chat-widget-root');
      if (container) {
        container.remove();
      }
      
      const styles = document.getElementById('nowgray-chat-widget-styles');
      if (styles) {
        styles.remove();
      }
      
      this.isLoaded = false;
      this.widget = null;
      
      if (this.config.debug) {
        console.log('🗑️ Nowgray Chat Widget destroyed');
      }
    },
    
    // Update configuration
    updateConfig: function(newConfig) {
      this.config = Object.assign(this.config, newConfig);
      
      if (this.isLoaded) {
        this.destroy();
        this.render();
      }
    },
    
    // Show the widget
    show: function() {
      const container = document.getElementById('nowgray-chat-widget-root');
      if (container) {
        container.style.display = 'block';
      }
    },
    
    // Hide the widget
    hide: function() {
      const container = document.getElementById('nowgray-chat-widget-root');
      if (container) {
        container.style.display = 'none';
      }
    },
    
    // Toggle visibility
    toggle: function() {
      const container = document.getElementById('nowgray-chat-widget-root');
      if (container) {
        const isVisible = container.style.display !== 'none';
        container.style.display = isVisible ? 'none' : 'block';
      }
    }
  };

  // Embedded widget component (this would normally be bundled)
  const EmbeddableChatWidget = function(props) {
    // This is a placeholder - in production, this would be the actual compiled component
    // For now, we'll return a simple implementation
    const [isOpen, setIsOpen] = React.useState(false);
    
    return React.createElement('div', {
      className: 'nowgray-chat-widget-container fixed ' + (
        props.position === 'bottom-left' ? 'bottom-4 left-4' :
        props.position === 'bottom-right' ? 'bottom-4 right-4' :
        props.position === 'top-left' ? 'top-4 left-4' :
        props.position === 'top-right' ? 'top-4 right-4' :
        'bottom-4 right-4'
      ),
      style: {
        zIndex: 999999,
        fontFamily: props.fontFamily
      }
    }, [
      // Chat button
      !isOpen && React.createElement('button', {
        key: 'button',
        className: 'nowgray-chat-button w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300',
        style: {
          background: `linear-gradient(135deg, ${props.primaryColor} 0%, ${props.secondaryColor} 100%)`,
          border: 'none',
          cursor: 'pointer'
        },
        onClick: () => setIsOpen(true)
      }, React.createElement('svg', {
        className: 'w-6 h-6',
        style: { color: 'white' },
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24'
      }, React.createElement('path', {
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        strokeWidth: 2,
        d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
      }))),
      
      // Chat window placeholder
      isOpen && React.createElement('div', {
        key: 'window',
        className: 'nowgray-chat-window w-96 h-96 bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden',
        style: {
          fontFamily: props.fontFamily,
          maxWidth: '24rem',
          height: '24rem'
        }
      }, [
        // Header
        React.createElement('div', {
          key: 'header',
          className: 'p-4 text-white rounded-t-3xl flex items-center justify-between',
          style: {
            background: `linear-gradient(135deg, ${props.primaryColor} 0%, ${props.secondaryColor} 100%)`
          }
        }, [
          React.createElement('h3', {
            key: 'title',
            className: 'font-bold text-sm'
          }, 'AI Assistant'),
          React.createElement('button', {
            key: 'close',
            onClick: () => setIsOpen(false),
            className: 'p-1 hover:bg-white/20 rounded transition-all',
            style: { border: 'none', background: 'transparent', cursor: 'pointer' }
          }, React.createElement('svg', {
            className: 'w-4 h-4',
            style: { color: 'white' },
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M6 18L18 6M6 6l12 12'
          })))
        ]),
        
        // Content area
        React.createElement('div', {
          key: 'content',
          className: 'flex-1 p-4 bg-gray-50 flex items-center justify-center'
        }, React.createElement('div', {
          className: 'text-center'
        }, [
          React.createElement('div', {
            key: 'icon',
            className: 'w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center',
            style: {
              background: `linear-gradient(135deg, ${props.primaryColor} 0%, ${props.secondaryColor} 100%)`
            }
          }, React.createElement('svg', {
            className: 'w-6 h-6',
            style: { color: 'white' },
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          }, React.createElement('path', {
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            strokeWidth: 2,
            d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
          }))),
          React.createElement('h4', {
            key: 'welcome',
            className: 'font-semibold text-gray-800 mb-2'
          }, 'Welcome to AI Chat!'),
          React.createElement('p', {
            key: 'subtitle',
            className: 'text-sm text-gray-600'
          }, 'This is a demo widget. Full implementation coming soon!'),
          React.createElement('p', {
            key: 'company',
            className: 'text-xs text-gray-500 mt-2'
          }, `Company ID: ${props.companyId}`)
        ]))
      ])
    ]);
  };

  // Make component available globally
  window.NowgrayEmbeddableChatWidget = EmbeddableChatWidget;

  // Auto-initialize if data attributes are present
  function autoInit() {
    const scripts = document.querySelectorAll('script[data-nowgray-company-id]');
    
    scripts.forEach(script => {
      const config = {
        companyId: script.getAttribute('data-nowgray-company-id'),
        widgetId: script.getAttribute('data-nowgray-widget-id') || null,
        position: script.getAttribute('data-nowgray-position') || 'bottom-right',
        primaryColor: script.getAttribute('data-nowgray-primary-color') || '#667eea',
        secondaryColor: script.getAttribute('data-nowgray-secondary-color') || '#764ba2',
        apiUrl: script.getAttribute('data-nowgray-api-url') || DEFAULT_CONFIG.apiUrl,
        debug: script.getAttribute('data-nowgray-debug') === 'true'
      };
      
      if (config.companyId) {
        window.NowgrayChatWidget.init(config);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Expose global functions for manual initialization
  window.initNowgrayChatWidget = function(config) {
    window.NowgrayChatWidget.init(config);
  };

  window.destroyNowgrayChatWidget = function() {
    window.NowgrayChatWidget.destroy();
  };

})();
