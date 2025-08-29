import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  MagnifyingGlassIcon, 
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import CompanyChatbot from '../../components/widget/CompanyChatbot';
import FixedChatbotIcon from '../../components/widget/FixedChatbotIcon';
import ChatWidget from '../../components/widget/chat/ChatWidget';
import { API_URL } from '../../utils/config';

const WidgetManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showFixedIcon, setShowFixedIcon] = useState(false);
  const [showEnhancedWidget, setShowEnhancedWidget] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState({
    theme: 'light',
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    welcomeMessage: 'Hello! How can I help you today?',
    enableAI: true
  });

  // Debounced search suggestions
  const debouncedFetchSuggestions = useCallback((query) => {
    let timeoutId;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      if (query.length > 2) {
        try {
          const response = await api.get(`${API_URL}/widget/search/suggestions?query=${encodeURIComponent(query)}&limit=5`);
          
          if (response.data.success) {
            setSuggestions(response.data.data);
            setShowSuggestions(true);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500); // Wait 500ms after user stops typing
  }, []);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear suggestions immediately if query is too short
    if (query.length <= 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      // Debounce the API call
      debouncedFetchSuggestions(query);
    }
  };

  // Handle search submission
  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await api.get(`${API_URL}/widget/search/ai?query=${encodeURIComponent(query)}&limit=5`);
      
      if (response.data.success) {
        setSearchResults(response.data.data);
      } else {
        // Handle API success: false case
        setSearchResults({
          answer: response.data.message || 'Sorry, I encountered an error while processing your request. Please try again.',
          source: 'error',
          confidence: 0,
          relatedFAQs: []
        });
      }
    } catch (error) {
      console.error('Error performing AI search:', error);
      
      let errorMessage = 'Sorry, I encountered an error while processing your request. Please try again.';
      
      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 401:
            errorMessage = 'Please log in to use the AI search feature.';
            break;
          case 400:
            errorMessage = data.message || 'Invalid search query. Please try again.';
            break;
          case 404:
            errorMessage = 'Search service not found. Please contact support.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = data.message || errorMessage;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        // Other error
        errorMessage = error.message || errorMessage;
      }
      
      setSearchResults({
        answer: errorMessage,
        source: 'error',
        confidence: 0,
        relatedFAQs: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.question);
    setShowSuggestions(false);
    handleSearch(suggestion.question);
  };

  // Handle enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Copy embed code
  const copyEmbedCode = () => {
    const embedCode = `<script src="https://widget.example.com/chat.js" data-widget-id="widget_123" data-company-id="${localStorage.getItem('companyId')}"></script>`;
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle preview widget
  const handlePreviewWidget = () => {
    setShowFixedIcon(true);
  };

  // Handle enhanced widget preview
  const handlePreviewEnhancedWidget = () => {
    setShowEnhancedWidget(!showEnhancedWidget);
  };

  // Handle test chat
  const handleTestChat = () => {
    setShowFixedIcon(true);
  };

  // Handle chatbot open
  const handleChatbotOpen = () => {
    setShowChatbot(true);
  };

  // Handle chatbot close
  const handleChatbotClose = () => {
    setShowChatbot(false);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Widget Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure and test your AI-powered chatbot widget
        </p>
      </div>

      {/* AI Search Test Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">AI-Powered Search Test</h2>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Test how your AI chatbot will respond to user questions using your FAQ knowledge base.
        </p>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Ask a question to test the AI response..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4 mr-1" />
                  Ask AI
                </>
              )}
            </button>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{suggestion.question}</div>
                  <div className="text-sm text-gray-500">
                    {suggestion.category} • {suggestion.views} views • {suggestion.helpfulCount} helpful
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <SparklesIcon className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">AI Response</span>
            </div>
            
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">{searchResults.answer}</div>
            </div>

            {/* Related FAQs */}
            {searchResults.relatedFAQs && searchResults.relatedFAQs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Related FAQs Used:</h4>
                <div className="space-y-2">
                  {searchResults.relatedFAQs.map((faq) => (
                    <div key={faq.id} className="text-sm bg-white rounded p-2 border">
                      <div className="font-medium text-gray-900">{faq.question}</div>
                      <div className="text-gray-500">
                        {faq.category} • {faq.views} views • {faq.helpfulCount} helpful
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Widget Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Cog6ToothIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Widget Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={widgetSettings.theme}
                onChange={(e) => setWidgetSettings({...widgetSettings, theme: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={widgetSettings.position}
                onChange={(e) => setWidgetSettings({...widgetSettings, position: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <input
                type="color"
                value={widgetSettings.primaryColor}
                onChange={(e) => setWidgetSettings({...widgetSettings, primaryColor: e.target.value})}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
              <textarea
                value={widgetSettings.welcomeMessage}
                onChange={(e) => setWidgetSettings({...widgetSettings, welcomeMessage: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter welcome message..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableAI"
                checked={widgetSettings.enableAI}
                onChange={(e) => setWidgetSettings({...widgetSettings, enableAI: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="enableAI" className="ml-2 block text-sm text-gray-900">
                Enable AI-powered responses
              </label>
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CodeBracketIcon className="h-6 w-6 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Embed Code</h2>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Copy and paste this code into your website to add the chatbot widget.
          </p>

          <div className="relative">
            <pre className="bg-gray-100 p-3 rounded-md text-sm overflow-x-auto">
              <code>{`<script src="https://widget.example.com/chat.js" data-widget-id="widget_123" data-company-id="${localStorage.getItem('companyId')}"></script>`}</code>
            </pre>
            <button
              onClick={copyEmbedCode}
              className="absolute top-2 right-2 p-1 bg-gray-200 hover:bg-gray-300 rounded"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4 text-gray-600" />
              )}
            </button>
          </div>

          <div className="mt-4 flex space-x-2">
            <button 
              onClick={handlePreviewEnhancedWidget}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                showEnhancedWidget 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {showEnhancedWidget ? (
                <>
                  <StopIcon className="h-4 w-4 mr-1" />
                  Hide Enhanced Widget
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Show Enhanced Widget
                </>
              )}
            </button>
            <button 
              onClick={handlePreviewWidget}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              Preview Widget
            </button>
            <button 
              onClick={handleTestChat}
              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              Test Chat
            </button>
          </div>
        </div>
      </div>

      {/* Widget Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Widget Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">1,234</div>
            <div className="text-sm text-gray-600">Total Interactions</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">89%</div>
            <div className="text-sm text-gray-600">Satisfaction Rate</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">567</div>
            <div className="text-sm text-gray-600">Unique Visitors</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">45</div>
            <div className="text-sm text-gray-600">Leads Generated</div>
          </div>
        </div>
      </div>

      {/* Enhanced Widget Preview Section */}
      {showEnhancedWidget && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Enhanced Widget Preview</h2>
                <p className="text-sm text-gray-500">Experience your company's enhanced chat widget</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Company ID: {user?.companyId || 'N/A'}</span>
              <button
                onClick={handlePreviewEnhancedWidget}
                className="flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200"
              >
                <StopIcon className="w-3 h-3 mr-1" />
                Close Preview
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-300">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Chat Widget</h3>
              <p className="text-sm text-gray-600 mb-4">
                Your company's enhanced chatbot widget is now active! Look for the floating button.
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Widget Active
                </span>
                <span>•</span>
                <span>Company ID: {user?.companyId || 'N/A'}</span>
                <span>•</span>
                <span>Widget ID: widget_{user?.companyId || 'test'}_demo</span>
              </div>
            </div>
            
            <div className="relative bg-white/50 rounded-lg p-4 border border-white/50 backdrop-blur-sm">
              <div className="text-center text-sm text-gray-600">
                <p>🎉 Your enhanced chat widget is now active!</p>
                <p className="mt-1">Look for the beautiful floating button in the bottom-right corner.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Chatbot Icon */}
      <FixedChatbotIcon 
        onClick={handleChatbotOpen}
        isVisible={showFixedIcon}
      />

      {/* Company Chatbot */}
      <CompanyChatbot 
        companyId={parseInt(localStorage.getItem('companyId')) || 6}
        isVisible={showChatbot}
        onClose={handleChatbotClose}
      />

      {/* Enhanced Chat Widget */}
      {showEnhancedWidget && (
        <ChatWidget 
          companyId={user?.companyId || 13} 
          widgetId={`widget_${user?.companyId || 13}_demo`} 
        />
      )}
    </div>
  );
};

export default WidgetManagement;
