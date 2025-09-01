import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon, SparklesIcon, UserIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { API_URL } from '../../utils/config';

const CompanyChatbot = ({ companyId, isVisible, onClose }) => {
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
  const messagesEndRef = useRef(null);
  const messagesTopRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);

  // Load chat history when widget opens
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      loadChatHistory();
    }
  }, [isVisible]);

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
      const response = await fetch(`${API_URL}/api/widget/search/history?companyId=${companyId || 6}&page=${page}&limit=20`, {
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
      const response = await fetch(`${API_URL}/api/widget/session/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyId || 6,
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
      // Ensure we have a valid company ID
      const validCompanyId = companyId && companyId > 0 ? companyId : 6;
      
      const response = await fetch(`${API_URL}/api/widget/search/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageType,
          content,
          companyId: validCompanyId,
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
      await fetch(`${API_URL}/api/widget/session/activity`, {
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
              const response = await fetch(`${API_URL}/api/widget/search/suggestions/public?query=${encodeURIComponent(query)}&limit=5&companyId=${companyId || 6}`, {
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
        }, 300); // 300ms delay
      };
    })(),
    [companyId]
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
    
    // Add user message showing the FAQ question
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
      // Get the answer for this specific FAQ
      const response = await fetch(`${API_URL}/api/widget/search/faq/public?faqId=${faq.id}&companyId=${companyId || 6}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setIsLoading(false);
        
        // Add bot message with typing animation
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          timestamp: new Date(),
          isTyping: true
        };

        setMessages(prev => [...prev, botMessage]);

        // Start typing animation
        setIsTyping(true);
        setTypingText(data.data.answer);

        // Store bot message
        await storeMessage('bot', data.data.answer);

        // Fallback: if typing animation doesn't complete within 5 seconds, force completion
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

  // Improved typing animation effect
  useEffect(() => {
    if (isTyping && typingText) {
      console.log('Starting typing animation with text:', typingText);
      let currentIndex = 0;
      
      const typeNextCharacter = () => {
        if (currentIndex >= typingText.length) {
          console.log('Typing animation completed');
          setIsTyping(false);
          return;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.isTyping 
            ? { ...msg, content: typingText.substring(0, currentIndex + 1) }
            : msg
        ));
        
        currentIndex++;
        setTimeout(typeNextCharacter, 30); // Faster typing for better UX
      };
      
      // Start typing immediately
      typeNextCharacter();
    }
  }, [isTyping, typingText]);

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    // Hide suggestions when sending message
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
      const response = await fetch(`${API_URL}/api/widget/search/ai/public?query=${encodeURIComponent(content)}&limit=5&companyId=${companyId || 6}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        console.log('API Response received:', data.data.answer);
        
        // Stop loading and start typing
        setIsLoading(false);
        
        // Add bot message with typing animation
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          timestamp: new Date(),
          isTyping: true
        };

        setMessages(prev => [...prev, botMessage]);

        // Start typing animation
        setIsTyping(true);
        setTypingText(data.data.answer);

        // Store bot message
        await storeMessage('bot', data.data.answer);

        // Fallback: if typing animation doesn't complete within 5 seconds, force completion
        setTimeout(() => {
          console.log('Forcing typing animation completion');
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
        const response = await fetch(`${API_URL}/api/widget/session/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionToken: sessionToken,
            visitorName: name,
            visitorEmail: email,
            visitorPhone: phone,
            topic: topic,
            companyId: companyId || 6
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setVisitorInfo(data.data.visitorInfo);
          console.log('✅ Visitor registered successfully');
        }
      } else {
        // Fallback - create lead directly
        const leadResponse = await fetch(`${API_URL}/api/widget/search/lead/public`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            topic,
            companyId: companyId || 6,
            formData: welcomeFormData,
            formType: 'chatbot_welcome',
            source: 'Chatbot Welcome Form'
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
    
    // Add welcome message with user info
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
    
    // Store the welcome message
    storeMessage('bot', welcomeMessage.content);
  };

  // Handle welcome form input change
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
      <div className="w-full max-w-md h-full bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col animate-slide-in-right overflow-hidden backdrop-blur-sm">
        {/* Enhanced Header with Modern Gradient */}
        <div 
          className="flex items-center justify-between p-6 text-white rounded-t-3xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10"></div>
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-white rounded-full translate-x-8 translate-y-8"></div>
          </div>
          
          <div className="flex items-center space-x-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <ChatBubbleLeftRightIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center">
                AI Assistant
                <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </h3>
              <p className="text-sm text-white/90 flex items-center">
                <SparklesIcon className="w-3 h-3 mr-1" />
                Powered by Nowgray
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 relative z-10">
            <button
              onClick={startNewChat}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-all duration-200 hover:scale-105 backdrop-blur-sm border border-white/30"
            >
              New Chat
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative">
          {/* Load More Button */}
          {hasMoreMessages && (
            <div className="flex justify-center mb-4">
              <button
                onClick={loadMoreMessages}
                disabled={isLoadingHistory}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingHistory ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ArrowUpIcon className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {isLoadingHistory ? 'Loading...' : 'Load More Messages'}
                </span>
              </button>
            </div>
          )}

          {/* Loading History Indicator */}
          {isLoadingHistory && messages.length === 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Loading chat history...</span>
              </div>
            </div>
          )}

          {/* Welcome Form */}
          {showWelcomeForm && !isLoadingHistory && (
            <div className="flex justify-center items-center py-8 animate-fade-in">
              <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Welcome! 👋</h3>
                    <p className="text-gray-600 text-sm">Let's get started with your conversation</p>
                  </div>
                  
                  <form onSubmit={handleWelcomeFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                      <input
                        type="text"
                        name="name"
                        value={welcomeFormData.name}
                        onChange={handleWelcomeFormChange}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email (Optional)</label>
                      <input
                        type="email"
                        name="email"
                        value={welcomeFormData.email}
                        onChange={handleWelcomeFormChange}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone (Optional)</label>
                      <input
                        type="tel"
                        name="phone"
                        value={welcomeFormData.phone}
                        onChange={handleWelcomeFormChange}
                        placeholder="Enter your phone"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">What can I help you with?</label>
                      <select
                        name="topic"
                        value={welcomeFormData.topic}
                        onChange={handleWelcomeFormChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
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
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      Start Chatting
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesTopRef} />
          
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 shadow-lg transform transition-all duration-300 hover:scale-[1.02] ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-lg'
                    : 'bg-white text-gray-800 rounded-bl-lg border border-gray-100 hover:shadow-xl'
                }`}
              >
                {message.isTyping ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">AI is typing...</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 flex items-center ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      <SparklesIcon className="w-3 h-3 mr-1" />
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Enhanced Loading indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-lg shadow-lg border border-gray-100 px-5 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Searching for answers...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced FAQ Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
            <div className="text-sm text-blue-600 mb-3 flex items-center font-medium">
              <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
              Quick FAQ Suggestions
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {suggestions.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleSuggestionClick(faq)}
                  className="w-full text-left p-3 bg-white rounded-xl border border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  <div className="font-medium text-gray-800 text-sm">{faq.question}</div>
                  <div className="text-blue-600 text-xs mt-1 flex items-center">
                    <span className="bg-blue-100 px-2 py-1 rounded-full">{faq.category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Input Area */}
        {!showWelcomeForm && (
          <div className="p-6 bg-white border-t border-gray-100 rounded-b-3xl">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="w-full px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm transition-all duration-200 hover:border-gray-400"
                />
                {isLoadingSuggestions && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl transition-all duration-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Enhanced Custom CSS */}
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-up {
          animation: slideUp 0.4s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyChatbot;
