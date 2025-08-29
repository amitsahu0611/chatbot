import React, { useState } from 'react';
import ChatWidget from '../../components/widget/chat/ChatWidget';

const WidgetChat = () => {
  const [companyId] = useState(1); // Mock company ID - in real app this would come from context/props
  const [widgetId] = useState('widget-001'); // Mock widget ID

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚀 Enhanced Chat Widget Demo</h1>
              <p className="mt-2 text-sm text-gray-600">
                Beautiful chatbot widget with form-first approach and AI-powered responses
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Company ID: {companyId}</p>
                <p className="text-xs text-gray-500">Widget ID: {widgetId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Demo Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">✨ New Enhanced Features</h2>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Form-First Approach</h3>
                    <p className="text-sm text-gray-600">New visitors see a form before chatting</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Bigger & More Beautiful</h3>
                    <p className="text-sm text-gray-600">Larger widget with gradient designs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Enhanced Animations</h3>
                    <p className="text-sm text-gray-600">Smooth hover effects and transitions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Smart Form Integration</h3>
                    <p className="text-sm text-gray-600">Dynamic form rendering with validation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 How to Test</h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>1. <strong>Click the chat button</strong> in the bottom-right corner</p>
                <p>2. <strong>First visit:</strong> You'll see a form to fill out</p>
                <p>3. <strong>After form submission:</strong> Chat interface appears</p>
                <p>4. <strong>Returning visitors:</strong> Go directly to chat</p>
                <p>5. <strong>Try the suggestions</strong> or type your own questions</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white p-6">
              <h2 className="text-xl font-semibold mb-4">🎨 Visual Improvements</h2>
              <div className="space-y-2">
                <p className="text-sm">• <strong>Larger widget:</strong> 450px width, 600px height</p>
                <p className="text-sm">• <strong>Gradient designs:</strong> Blue to purple gradients</p>
                <p className="text-sm">• <strong>Enhanced button:</strong> 16x16 size with hover effects</p>
                <p className="text-sm">• <strong>Better shadows:</strong> Multiple shadow layers</p>
                <p className="text-sm">• <strong>Smooth animations:</strong> Scale and fade effects</p>
              </div>
            </div>
          </div>

          {/* Widget Preview */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 Widget Preview</h2>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-gray-700 mb-2 font-medium">Enhanced Chat Widget</p>
                <p className="text-sm text-gray-500">Look for the beautiful chat button in the bottom-right corner</p>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>Tip:</strong> The widget is now bigger and more beautiful with gradient designs!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget companyId={companyId} widgetId={widgetId} />
    </div>
  );
};

export default WidgetChat;
