import React, { useState, useRef, useEffect, useCallback } from 'react';

// Self-contained embeddable chat widget that can be used anywhere
const EmbeddableChatWidget = ({ 
  companyId, 
  widgetId = null,
  position = 'bottom-right',
  theme = 'default',
  apiUrl = 'http://localhost:5001', // Make this configurable
  primaryColor = '#667eea',
  secondaryColor = '#764ba2',
  fontFamily = 'Inter, system-ui, -apple-system, sans-serif'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [showWelcomeForm, setShowWelcomeForm] = useState(false);
  const [welcomeFormData, setWelcomeFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: ''
  });
  const [widgetConfig, setWidgetConfig] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null);
  const inputRef = useRef(null);

  // Load widget configuration
  useEffect(() => {
    if (companyId && widgetId) {
      loadWidgetConfig();
    }
  }, [companyId, widgetId]);

  // Load widget configuration from API
  const loadWidgetConfig = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/widget/${widgetId}?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setWidgetConfig(data.data);
      }
    } catch (error) {
      console.error('Error loading widget config:', error);
    }
  };

  // Load chat history when widget opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory();
    }
  }, [isOpen]);

  // Start new chat function
  const startNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setCurrentPage(1);
    setHasMoreMessages(true);
    setShowWelcomeForm(true);
    setShowSuggestions(false);
    setInputValue('');
  };

  // Load chat history with simplified logic - check history first, show form if none exists
  const loadChatHistory = async (page = 1) => {
    if (page === 1) {
      setIsLoadingHistory(true);
    }

    try {
      // First try to load chat history for this company
      const response = await fetch(`${apiUrl}/api/widget/search/history?companyId=${companyId}&page=${page}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success && data.data.messages && data.data.messages.length > 0) {
        // Has chat history - load it
        if (page === 1) {
          setMessages(data.data.messages);
          setCurrentPage(1);
        } else {
          setMessages(prev => [...data.data.messages, ...prev]);
        }
        
        setHasMoreMessages(data.data.pagination?.hasMore || false);
        setSessionId(data.data.currentSessionId);
        
        // Also check session for visitor info
        if (page === 1) {
          checkSession();
        }
      } else {
        // No chat history - show registration form for this company
        if (page === 1) {
          setMessages([]);
          setShowWelcomeForm(true);
          // Still create a session for tracking
          checkSession();
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      if (page === 1) {
        // On error, show registration form as fallback
        setShowWelcomeForm(true);
        checkSession();
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Check and create session
  const checkSession = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/widget/session/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId,
          sessionDurationMinutes: 120
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSessionToken(data.data.sessionToken);
        if (data.data.hasActiveSession && data.data.visitorInfo) {
          setVisitorInfo(data.data.visitorInfo);
          // Pre-populate form with existing visitor info
          setWelcomeFormData({
            name: data.data.visitorInfo.name || '',
            email: data.data.visitorInfo.email || '',
            phone: data.data.visitorInfo.phone || '',
            topic: data.data.visitorInfo.topic || ''
          });
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (isLoadingHistory || !hasMoreMessages) return;
    
    const nextPage = currentPage + 1;
    await loadChatHistory(nextPage);
    setCurrentPage(nextPage);
  };

  // Store message in database
  const storeMessage = async (messageType, content, customSessionId = null) => {
    try {
      const response = await fetch(`${apiUrl}/api/widget/search/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageType,
          content,
          companyId: companyId,
          sessionId: customSessionId || sessionId
        })
      });

      const data = await response.json();
      if (data.success) {
        setSessionId(data.data.sessionId);
      }
      
      // Update session activity
      if (sessionToken) {
        updateSessionActivity();
      }
    } catch (error) {
      console.error('Error storing message:', error);
    }
  };

  // Update session activity
  const updateSessionActivity = async () => {
    try {
      await fetch(`${apiUrl}/api/widget/session/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: sessionToken
        })
      });
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced FAQ suggestions
  const debouncedFetchSuggestions = useCallback(
    (() => {
      let timeoutId;
      return (query) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (query.length > 2) {
            setIsLoadingSuggestions(true);
            try {
              const response = await fetch(`${apiUrl}/api/widget/search/suggestions/public?query=${encodeURIComponent(query)}&limit=5&companyId=${companyId}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json'
                }
              });
              
              const data = await response.json();
              
              if (data.success) {
                setSuggestions(data.data);
                setShowSuggestions(true);
              } else {
                setSuggestions([]);
                setShowSuggestions(false);
              }
            } catch (error) {
              console.error('Error fetching suggestions:', error);
              setSuggestions([]);
              setShowSuggestions(false);
            } finally {
              setIsLoadingSuggestions(false);
            }
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        }, 300);
      };
    })(),
    [companyId, apiUrl]
  );

  // Handle input change with suggestions
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedFetchSuggestions(value);
  };

  // Handle FAQ suggestion click
  const handleSuggestionClick = async (faq) => {
    setShowSuggestions(false);
    setInputValue('');
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: faq.question,
      timestamp: new Date(),
      isTyping: false
    };

    setMessages(prev => [...prev, userMessage]);
    await storeMessage('user', faq.question);
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/widget/search/faq/public?faqId=${faq.id}&companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setIsLoading(false);
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          timestamp: new Date(),
          isTyping: true
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(true);
        setTypingText(data.data.answer);
        await storeMessage('bot', data.data.answer);

        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => prev.map(msg => 
            msg.isTyping 
              ? { ...msg, content: data.data.answer, isTyping: false }
              : msg
          ));
        }, 5000);

      } else {
        throw new Error(data.message || 'Failed to get FAQ answer');
      }
    } catch (error) {
      console.error('Error getting FAQ answer:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble getting the answer for this FAQ. Please try again.",
        timestamp: new Date(),
        isTyping: false
      };
      setMessages(prev => [...prev, errorMessage]);
      await storeMessage('bot', errorMessage.content);
      setIsLoading(false);
    }
  };

  // Typing animation effect
  useEffect(() => {
    if (isTyping && typingText) {
      let currentIndex = 0;
      
      const typeNextCharacter = () => {
        if (currentIndex >= typingText.length) {
          setIsTyping(false);
          return;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.isTyping 
            ? { ...msg, content: typingText.substring(0, currentIndex + 1) }
            : msg
        ));
        
        currentIndex++;
        setTimeout(typeNextCharacter, 30);
      };
      
      typeNextCharacter();
    }
  }, [isTyping, typingText]);

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    setShowSuggestions(false);

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isTyping: false
    };

    setMessages(prev => [...prev, userMessage]);
    await storeMessage('user', content.trim());
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/widget/search/ai/public?query=${encodeURIComponent(content)}&limit=5&companyId=${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setIsLoading(false);
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          timestamp: new Date(),
          isTyping: true
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(true);
        setTypingText(data.data.answer);
        await storeMessage('bot', data.data.answer);

        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => prev.map(msg => 
            msg.isTyping 
              ? { ...msg, content: data.data.answer, isTyping: false }
              : msg
          ));
        }, 5000);

      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isTyping: false
      };
      setMessages(prev => [...prev, errorMessage]);
      await storeMessage('bot', errorMessage.content);
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Handle welcome form submission
  const handleWelcomeFormSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, topic } = welcomeFormData;
    
    if (!name) {
      alert('Please enter your name to continue.');
      return;
    }
    
    try {
      // Register visitor with session
      if (sessionToken) {
        const response = await fetch(`${apiUrl}/api/widget/session/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: sessionToken,
            visitorName: name,
            visitorEmail: email,
            visitorPhone: phone,
            topic: topic,
            companyId: companyId
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setVisitorInfo(data.data.visitorInfo);
          console.log('✅ Visitor registered successfully');
        }
      } else {
        // Fallback - create lead directly
        const leadResponse = await fetch(`${apiUrl}/api/widget/search/lead/public`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            topic,
            companyId: companyId,
            formData: welcomeFormData,
            formType: 'chatbot_welcome',
            source: 'Embeddable Chat Widget'
          })
        });

        const leadData = await leadResponse.json();
        if (leadData.success) {
          console.log('✅ Lead created successfully:', leadData.data);
        }
      }
    } catch (error) {
      console.error('❌ Error registering visitor:', error);
    }
    
    const welcomeMessage = {
      id: 'welcome',
      type: 'bot',
      content: `Hello ${name}! 👋 Thank you for providing your information. I'm here to help you${topic ? ` with ${topic.toLowerCase()}` : ''}. What questions do you have for me?`,
      timestamp: new Date(),
      isTyping: false
    };

    setMessages([welcomeMessage]);
    setShowWelcomeForm(false);
    setWelcomeFormData({ name: '', email: '', phone: '', topic: '' });
    storeMessage('bot', welcomeMessage.content);
  };

  const handleWelcomeFormChange = (e) => {
    const { name, value } = e.target;
    setWelcomeFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  // CSS custom properties for theming
  const themeStyles = {
    '--primary-color': primaryColor,
    '--secondary-color': secondaryColor,
    '--font-family': fontFamily
  };

  return (
    <div style={themeStyles} className={`nowgray-chat-widget-container fixed ${getPositionClasses()} z-50`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="nowgray-chat-button w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            fontFamily: fontFamily
          }}
        >
          {/* Chat Icon */}
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="nowgray-chat-window w-96 h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ fontFamily: fontFamily }}
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 text-white rounded-t-3xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
            }}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full translate-x-8 translate-y-8"></div>
            </div>
            
            <div className="flex items-center space-x-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center">
                  AI Assistant
                  <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </h3>
                <p className="text-xs text-white/90 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Powered by Nowgray
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 relative z-10">
              <button
                onClick={startNewChat}
                className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs rounded-full transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/30"
              >
                New
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 via-white to-gray-50">
            {/* Load More Button */}
            {hasMoreMessages && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={loadMoreMessages}
                  disabled={isLoadingHistory}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  {isLoadingHistory ? (
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  )}
                  <span className="font-medium">
                    {isLoadingHistory ? 'Loading...' : 'Load More'}
                  </span>
                </button>
              </div>
            )}

            {/* Loading History */}
            {isLoadingHistory && messages.length === 0 && (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 text-sm">Loading chat history...</span>
                </div>
              </div>
            )}

            {/* Welcome Form */}
            {showWelcomeForm && !isLoadingHistory && (
              <div className="flex justify-center items-center py-4">
                <div className="w-full max-w-sm">
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                    <div className="text-center mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                        }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Welcome! 👋</h3>
                      <p className="text-gray-600 text-xs">Let's get started</p>
                    </div>
                    
                    <form onSubmit={handleWelcomeFormSubmit} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          name="name"
                          value={welcomeFormData.name}
                          onChange={handleWelcomeFormChange}
                          placeholder="Enter your name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email (Optional)</label>
                        <input
                          type="email"
                          name="email"
                          value={welcomeFormData.email}
                          onChange={handleWelcomeFormChange}
                          placeholder="Enter your email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone (Optional)</label>
                        <input
                          type="tel"
                          name="phone"
                          value={welcomeFormData.phone}
                          onChange={handleWelcomeFormChange}
                          placeholder="Enter your phone"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">How can we help?</label>
                        <select
                          name="topic"
                          value={welcomeFormData.topic}
                          onChange={handleWelcomeFormChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        >
                          <option value="">Select a topic</option>
                          <option value="General Information">General Information</option>
                          <option value="Account Management">Account Management</option>
                          <option value="Technical Support">Technical Support</option>
                          <option value="Billing & Payments">Billing & Payments</option>
                          <option value="Product Features">Product Features</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                        }}
                      >
                        Start Chatting
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesTopRef} />
            
            {/* Messages */}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-lg transform transition-all duration-300 hover:scale-[1.02] text-sm ${
                    message.type === 'user'
                      ? 'text-white rounded-br-lg'
                      : 'bg-white text-gray-800 rounded-bl-lg border border-gray-100 hover:shadow-xl'
                  }`}
                  style={message.type === 'user' ? {
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                  } : {}}
                >
                  {message.isTyping ? (
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">AI is typing...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 flex items-center ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-lg shadow-lg border border-gray-100 px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-600">Searching for answers...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* FAQ Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
              <div className="text-xs text-blue-600 mb-2 flex items-center font-medium">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Quick FAQ Suggestions
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {suggestions.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleSuggestionClick(faq)}
                    className="w-full text-left p-2 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                  >
                    <div className="font-medium text-gray-800 text-xs">{faq.question}</div>
                    <div className="text-blue-600 text-xs mt-1 flex items-center">
                      <span className="bg-blue-100 px-2 py-0.5 rounded-full">{faq.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          {!showWelcomeForm && (
            <div className="p-4 bg-white border-t border-gray-100 rounded-b-3xl">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm transition-all duration-200 hover:border-gray-400"
                  />
                  {isLoadingSuggestions && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="p-2 text-white rounded-xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:opacity-50"
                  style={{
                    background: inputValue.trim() && !isLoading 
                      ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                      : '#e5e7eb'
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Inline Styles for Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
          0%, 100% { 
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% { 
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-bounce { animation: bounce 1s infinite; }
        .animate-spin { animation: spin 1s linear infinite; }
        
        .nowgray-chat-widget-container * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default EmbeddableChatWidget;
