import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, SparklesIcon } from '@heroicons/react/24/outline';

const FixedChatbotIcon = ({ onClick, isVisible }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show sparkles animation when widget becomes visible
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Sparkles animation */}
      {showSparkles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.5s'
              }}
            >
              <SparklesIcon className="w-4 h-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 flex items-center justify-center group chatbot-icon-hover chatbot-bounce transform hover:scale-110"
        style={{
          boxShadow: isHovered 
            ? '0 20px 40px rgba(59, 130, 246, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.1)' 
            : '0 10px 25px rgba(59, 130, 246, 0.3)',
        }}
      >
        {/* Main icon */}
        <ChatBubbleLeftRightIcon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" />
        
        {/* Animated background rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 opacity-20 animate-ping"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 opacity-10 animate-pulse"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
        
        {/* Notification badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
          <span className="text-xs font-bold text-white">AI</span>
          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-float"
              style={{
                left: `${20 + i * 20}%`,
                top: `${20 + i * 10}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: '3s'
              }}
            />
          ))}
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap transform translate-y-2 group-hover:translate-y-0 shadow-xl">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-4 h-4 text-yellow-400" />
            <span className="font-medium">Chat with AI Assistant</span>
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>
    </div>
  );
};

export default FixedChatbotIcon;
