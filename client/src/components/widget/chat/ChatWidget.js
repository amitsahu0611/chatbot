import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon, XMarkIcon, ChatBubbleLeftRightIcon, UserIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { API_URL } from '../../../utils/config';
import { getValidCompanyId } from '../../../utils/companyUtils';

const ChatWidget = ({ companyId, widgetId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [companyForms, setCompanyForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [visitorInfo, setVisitorInfo] = useState(null);
  const [isIPRegistered, setIsIPRegistered] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check if IP is registered and load company forms
  useEffect(() => {
    const checkIPAndLoadForms = async () => {
      try {
        const finalCompanyId = getValidCompanyId(companyId);
        
        // Check if visitor info exists in localStorage (simulating IP check)
        const storedVisitorInfo = localStorage.getItem(`visitor_${finalCompanyId}`);
        if (storedVisitorInfo) {
          setVisitorInfo(JSON.parse(storedVisitorInfo));
          setIsIPRegistered(true);
        }

        // Load company forms
        const response = await fetch(`${API_URL}/api/widget/form/company/${finalCompanyId}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          setCompanyForms(data.data);
          // Use the first form as default
          setSelectedForm(data.data[0]);
        }
      } catch (error) {
        console.error('Error loading forms:', error);
      }
    };

    if (isOpen) {
      checkIPAndLoadForms();
    }
  }, [isOpen, companyId]);

  // Welcome message and form display logic
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (!isIPRegistered && companyForms.length > 0) {
        // Show form first for new visitors
        setShowLeadForm(true);
        setMessages([
          {
            id: 'welcome',
            type: 'bot',
            content: "Hello! 👋 Welcome to our website. Before we start chatting, could you please fill out this quick form so I can better assist you?",
            timestamp: new Date(),
            isTyping: false
          }
        ]);
      } else {
        // Direct chat for returning visitors
        setShowLeadForm(false);
        setMessages([
          {
            id: 'welcome',
            type: 'bot',
            content: `Welcome back${visitorInfo?.name ? ` ${visitorInfo.name}` : ''}! 👋 How can I help you today?`,
            timestamp: new Date(),
            isTyping: false
          }
        ]);
        setSuggestions([
          "What services do you offer?",
          "How can I contact support?",
          "What are your business hours?",
          "How do I get started?"
        ]);
        setShowSuggestions(true);
      }
    }
  }, [isOpen, isIPRegistered, companyForms, visitorInfo]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Improved typing animation effect
  useEffect(() => {
    if (isTyping && typingText) {
      let currentIndex = 0;
      
      const typeNextCharacter = () => {
        if (currentIndex >= typingText.length) {
          setIsTyping(false);
          setIsLoading(false);
          setShowSuggestions(true);
          return;
        }
        
        setMessages(prev => prev.map(msg => 
          msg.isTyping 
            ? { ...msg, content: typingText.substring(0, currentIndex + 1) }
            : msg
        ));
        
        const currentChar = typingText[currentIndex];
        let delay = 35;
        
        if (currentChar === '.' || currentChar === '!' || currentChar === '?') {
          delay = 200;
        } else if (currentChar === ',' || currentChar === ';' || currentChar === ':') {
          delay = 100;
        } else if (currentChar === ' ') {
          delay = 25;
        }
        
        currentIndex++;
        setTimeout(typeNextCharacter, delay);
      };
      
      setTimeout(typeNextCharacter, 300);
    }
  }, [isTyping, typingText]);

  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date(),
      isTyping: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      await createLeadFromChat(content);

      const response = await fetch(`${API_URL}/api/widget/search/ai?query=${encodeURIComponent(content)}&limit=5`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setIsTyping(true);
        setTypingText(data.data.answer);
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: '',
          timestamp: new Date(),
          isTyping: true
        };

        setMessages(prev => [...prev, botMessage]);

        setTimeout(() => {
          setIsTyping(true);
        }, 300);

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
      setIsLoading(false);
      setShowSuggestions(true);
    }
  };

  const createLeadFromChat = async (message) => {
    try {
      const userAgent = navigator.userAgent;
      const currentPage = window.location.href;
      const referrer = document.referrer;
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const finalCompanyId = getValidCompanyId(companyId);
      
      const leadData = {
        companyId: finalCompanyId,
        widgetId: widgetId || 'widget-001',
        name: visitorInfo?.name || null,
        email: visitorInfo?.email || null,
        phone: visitorInfo?.phone || null,
        message: message,
        sessionId: sessionId,
        userAgent: userAgent,
        currentPage: currentPage,
        referrer: referrer
      };

      const response = await fetch(`${API_URL}/api/widget/chat/lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leadData)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Lead created successfully:', data.data);
      } else {
        console.warn('Failed to create lead:', data.message);
      }
    } catch (error) {
      console.error('Error creating lead from chat:', error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedForm) return;

    setIsSubmittingForm(true);

    try {
      const finalCompanyId = getValidCompanyId(companyId);
      
      // Submit form data
      const formResponse = await fetch(`${API_URL}/api/widget/form/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          formId: selectedForm.id,
          formData: formData,
          sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          pageUrl: window.location.href
        })
      });

      const formData = await formResponse.json();

      if (formData.success) {
        // Extract visitor info from form data
        const extractedInfo = {
          name: formData.name || formData.formData?.name || null,
          email: formData.email || formData.formData?.email || null,
          phone: formData.phone || formData.formData?.phone || null
        };

        // Store visitor info
        setVisitorInfo(extractedInfo);
        localStorage.setItem(`visitor_${finalCompanyId}`, JSON.stringify(extractedInfo));
        setIsIPRegistered(true);
        setShowLeadForm(false);

        // Add success message
        const successMessage = {
          id: Date.now(),
          type: 'bot',
          content: `Thank you${extractedInfo.name ? ` ${extractedInfo.name}` : ''}! 🎉 Your information has been submitted successfully. Now let's start chatting! How can I help you today?`,
          timestamp: new Date(),
          isTyping: false
        };

        setMessages(prev => [...prev, successMessage]);

        // Set suggestions for chat
        setSuggestions([
          "What services do you offer?",
          "How can I contact support?",
          "What are your business hours?",
          "How do I get started?"
        ]);
        setShowSuggestions(true);

        // Create initial lead
        await createLeadFromChat(`Form submitted: ${extractedInfo.name || 'Anonymous'} - ${extractedInfo.email || 'No email'}`);

      } else {
        throw new Error(formData.message || 'Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = {
        id: Date.now(),
        type: 'bot',
        content: "I'm sorry, there was an error submitting your information. Please try again or contact us directly.",
        timestamp: new Date(),
        isTyping: false
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleFormFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderFormField = (field) => {
    const fieldId = field.id || field.name;
    const fieldType = field.type || 'text';
    const isRequired = field.required || false;
    const placeholder = field.placeholder || field.label || field.name;

    switch (fieldType) {
      case 'textarea':
        return (
          <textarea
            key={fieldId}
            id={fieldId}
            name={fieldId}
            placeholder={placeholder}
            required={isRequired}
            value={formData[fieldId] || ''}
            onChange={(e) => handleFormFieldChange(fieldId, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
        );
      case 'email':
        return (
          <div key={fieldId} className="relative">
            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id={fieldId}
              name={fieldId}
              placeholder={placeholder}
              required={isRequired}
              value={formData[fieldId] || ''}
              onChange={(e) => handleFormFieldChange(fieldId, e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
      case 'tel':
        return (
          <div key={fieldId} className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              id={fieldId}
              name={fieldId}
              placeholder={placeholder}
              required={isRequired}
              value={formData[fieldId] || ''}
              onChange={(e) => handleFormFieldChange(fieldId, e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
      default:
        return (
          <div key={fieldId} className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              id={fieldId}
              name={fieldId}
              placeholder={placeholder}
              required={isRequired}
              value={formData[fieldId] || ''}
              onChange={(e) => handleFormFieldChange(fieldId, e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
    }
  };

  return (
    <>
      {/* Enhanced Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center group z-50 transform hover:scale-110"
        >
          <ChatBubbleLeftRightIcon className="w-7 h-7" />
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
          <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      )}

      {/* Enhanced Chat Widget Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[450px] h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col z-50 widget-fade-in overflow-hidden">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white rounded-t-3xl">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <ChatBubbleLeftRightIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Customer Support</h3>
                <p className="text-sm text-blue-100">We're here to help!</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Enhanced Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-lg shadow-lg'
                      : 'bg-white text-gray-800 rounded-bl-lg shadow-lg border border-gray-100'
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500">AI is typing...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-2 ${
                        message.type === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Enhanced Lead Form */}
            {showLeadForm && selectedForm && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{selectedForm.name}</h4>
                  {selectedForm.description && (
                    <p className="text-sm text-gray-600">{selectedForm.description}</p>
                  )}
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {selectedForm.fields && selectedForm.fields.map((field) => (
                    <div key={field.id || field.name}>
                      {field.label && (
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      {renderFormField(field)}
                    </div>
                  ))}
                  
                  <button
                    type="submit"
                    disabled={isSubmittingForm}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    {isSubmittingForm ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      selectedForm.settings?.submitButtonText || 'Submit & Start Chat'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Enhanced Suggestions */}
            {suggestions.length > 0 && !isLoading && showSuggestions && !showLeadForm && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 text-center font-medium">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 rounded-2xl rounded-bl-lg shadow-lg border border-gray-100 px-5 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-sm text-gray-600">Searching for answers...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Input Area */}
          <div className="p-6 bg-white border-t border-gray-100 rounded-b-3xl">
            <form onSubmit={handleSubmit} className="flex space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={showLeadForm ? "Please complete the form above first" : "Type your message..."}
                disabled={isLoading || showLeadForm}
                className="flex-1 px-5 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading || showLeadForm}
                className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Custom CSS */}
      <style jsx>{`
        .widget-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
        
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </>
  );
};

export default ChatWidget;
