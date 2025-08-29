import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '../widget/chat/ChatWidget';

const Layout = () => {
  const { user } = useAuth();
  
  // Determine company ID based on user context
  const getCompanyId = () => {
    if (user?.companyId) {
      return user.companyId;
    }
    // Default company ID for demo purposes
    return 13;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
      
      {/* Enhanced Chat Widget - Permanent throughout the system */}
      <ChatWidget 
        companyId={getCompanyId()} 
        widgetId={`widget_${getCompanyId()}_permanent`} 
      />
    </div>
  );
};

export default Layout;
