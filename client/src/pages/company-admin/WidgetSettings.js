import React, { useState, useEffect, useContext } from 'react';
import { 
  CodeBracketIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { AuthContext } from '../../context/AuthContext';
import { getValidCompanyId } from '../../utils/companyUtils';

const WidgetSettings = () => {
  const { companyId } = useContext(AuthContext);
  const [widgetId, setWidgetId] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);

  useEffect(() => {
    // Generate a unique widget ID based on company ID
    const finalCompanyId = getValidCompanyId(companyId);
    const generatedWidgetId = `widget_${finalCompanyId}_${Date.now()}`;
    setWidgetId(generatedWidgetId);
  }, [companyId]);

  const embedCode = `<script src="http://localhost:5001/api/widget/chat.js" data-widget-id="${widgetId}" data-company-id="${getValidCompanyId(companyId)}"></script>`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handlePreviewWidget = () => {
    setShowPreview(true);
    // In a real implementation, this would open a preview modal or new window
    console.log('Preview widget with ID:', widgetId);
  };

  const handleTestChat = () => {
    setShowTestChat(true);
    // In a real implementation, this would open a test chat interface
    console.log('Test chat with widget ID:', widgetId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Widget Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure and embed your chatbot widget on your website
          </p>
        </div>
      </div>

      {/* Widget Configuration */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Widget Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget ID
            </label>
            <input
              type="text"
              value={widgetId}
              onChange={(e) => setWidgetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter widget ID"
            />
            <p className="mt-1 text-xs text-gray-500">
              Unique identifier for your widget
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company ID
            </label>
            <input
              type="text"
              value={getValidCompanyId(companyId)}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Automatically set based on your account
            </p>
          </div>
        </div>
      </div>

      {/* Embed Code Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center mb-4">
          <CodeBracketIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Embed Code</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Copy and paste this code into your website to add the chatbot widget.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <code className="text-sm text-gray-800 font-mono break-all">
              {embedCode}
            </code>
            <button
              onClick={handleCopyCode}
              className="ml-4 p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Copy code"
            >
              {isCopied ? (
                <CheckIcon className="h-5 w-5 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handlePreviewWidget}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Preview Widget
          </button>
          
          <button
            onClick={handleTestChat}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            Test Chat
          </button>
        </div>
      </div>

      {/* Widget Customization */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Widget Customization</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Welcome Message
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your welcome message..."
              defaultValue="Hello! 👋 I'm here to help you with any questions about our services."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Position
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <input
              type="color"
              defaultValue="#2563eb"
              className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Size
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="small">Small</option>
            </select>
          </div>
        </div>
      </div>

      {/* Installation Instructions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Installation Instructions</h2>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Copy the embed code</h3>
              <p className="text-sm text-gray-600 mt-1">
                Click the copy button above to copy the JavaScript code to your clipboard.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Paste into your website</h3>
              <p className="text-sm text-gray-600 mt-1">
                Paste the code just before the closing &lt;/body&gt; tag in your HTML.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Test the widget</h3>
              <p className="text-sm text-gray-600 mt-1">
                Refresh your website and click the chat icon to test the widget functionality.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal (placeholder) */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Widget Preview</h3>
            <p className="text-gray-600 mb-4">
              This would show a preview of how the widget will appear on your website.
            </p>
            <button
              onClick={() => setShowPreview(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Test Chat Modal (placeholder) */}
      {showTestChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Test Chat</h3>
            <p className="text-gray-600 mb-4">
              This would open a test chat interface to verify the widget functionality.
            </p>
            <button
              onClick={() => setShowTestChat(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetSettings;
