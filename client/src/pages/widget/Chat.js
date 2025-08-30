import React, { useState } from 'react';


const WidgetChat = () => {
  const [companyId] = useState(13); // Use the test company ID
  const [widgetId] = useState('widget_13_test'); // Use the test widget ID


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🚀 Enhanced Chat Widget Demo
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Experience our beautiful chatbot widget with modern UI, smooth animations, and AI-powered responses
              </p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-gray-900">Company ID: {companyId}</p>
                <p className="text-xs text-gray-500">Widget ID: {widgetId}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">Widget Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column - Features */}
          <div className="space-y-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-soft border border-white/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  ✨
                </span>
                Key Features
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Modern UI Design</h3>
                    <p className="text-sm text-gray-600">Beautiful gradient backgrounds, smooth animations, and glass-morphism effects</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Smart Form Integration</h3>
                    <p className="text-sm text-gray-600">Lead capture forms that appear for new visitors, seamless transition to chat</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI-Powered Responses</h3>
                    <p className="text-sm text-gray-600">Intelligent chatbot with typing animations and contextual suggestions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Real-time Notifications</h3>
                    <p className="text-sm text-gray-600">Toast notifications for form submissions and error handling</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-soft border border-white/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  🎨
                </span>
                Design Highlights
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">Gradient Effects</h4>
                  <p className="text-xs text-blue-700">Beautiful color transitions throughout the interface</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 border border-green-100">
                  <h4 className="font-semibold text-green-900 mb-2">Smooth Animations</h4>
                  <p className="text-xs text-green-700">60fps animations with easing curves</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-2">Glass Morphism</h4>
                  <p className="text-xs text-purple-700">Modern backdrop blur effects</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
                  <h4 className="font-semibold text-orange-900 mb-2">Micro Interactions</h4>
                  <p className="text-xs text-orange-700">Subtle hover and focus states</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Demo Info */}
          <div className="space-y-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-soft border border-white/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  🧪
                </span>
                Try It Out
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Look for the floating chat button in the bottom-right corner. Click it to experience the enhanced widget!
                </p>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Demo Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Click the floating chat button</li>
                    <li>Fill out the lead capture form (if shown)</li>
                    <li>Try the suggested questions</li>
                    <li>Type your own messages</li>
                    <li>Experience the smooth animations</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-soft border border-white/50">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  ⚡
                </span>
                Performance
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Load Time</span>
                  <span className="text-sm font-semibold text-green-600">~200ms</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Animation FPS</span>
                  <span className="text-sm font-semibold text-green-600">60fps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Bundle Size</span>
                  <span className="text-sm font-semibold text-green-600">~45KB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Browser Support</span>
                  <span className="text-sm font-semibold text-green-600">Modern Browsers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Chat Widget - Now available globally via App.js */}
      <div className="text-center p-8">
        <p className="text-sm text-gray-600">
          🎉 The chat widget is now available globally! Look for the floating chat button.
        </p>
      </div>
    </div>
  );
};

export default WidgetChat;
