import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthRedirect from './components/auth/AuthRedirect';

// Layout Components
import Layout from './components/common/Layout';
import SuperAdminLayout from './components/super-admin/SuperAdminLayout';
import CompanyAdminLayout from './components/company-admin/CompanyAdminLayout';

// Super Admin Pages
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import CompaniesManagement from './pages/super-admin/CompaniesManagement';
import UsersManagement from './pages/super-admin/UsersManagement';
import CompanySelection from './pages/super-admin/CompanySelection';

// Company Admin Pages
import CompanyDashboard from './pages/company-admin/Dashboard';
import FormBuilder from './pages/company-admin/FormBuilder';
import LeadViewer from './pages/company-admin/LeadViewer';
import FAQManager from './pages/company-admin/FAQManager';
import SupportSettings from './pages/company-admin/SupportSettings';
import WidgetManagement from './pages/company-admin/WidgetManagement';
import WidgetSettings from './pages/company-admin/WidgetSettings';

// Analytics & Integrations
import Analytics from './pages/analytics/Analytics';
import Integrations from './pages/integrations/Integrations';

// Widget Pages
import WidgetChat from './pages/widget/Chat';
import WidgetForm from './pages/widget/Form';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Global Chat Components
import CompanyChatbot from './components/widget/CompanyChatbot';
import FixedChatbotIcon from './components/widget/FixedChatbotIcon';

function App() {
  const [showChatbot, setShowChatbot] = useState(false);

  // Get company ID from localStorage or default
  const getCompanyId = () => {
    return parseInt(localStorage.getItem('companyId') || localStorage.getItem('selectedCompanyId')) || 6;
  };

  const handleChatbotOpen = () => {
    setShowChatbot(true);
  };

  const handleChatbotClose = () => {
    setShowChatbot(false);
  };

  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Super Admin Routes */}
          <Route path="/super-admin" element={
            <ProtectedRoute requiredRole="super_admin">
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="companies" element={<CompaniesManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Super Admin Settings</h1><p className="mt-4 text-gray-600">Settings page coming soon...</p></div>} />
          </Route>
          
          {/* Company Selection Route for Super Admin */}
          <Route path="/company-selection" element={
            <ProtectedRoute requiredRole="super_admin">
              <CompanySelection />
            </ProtectedRoute>
          } />
          
          {/* Company Admin Routes */}
          <Route path="/company-admin" element={
            <ProtectedRoute requiredRole="company_admin">
              <CompanyAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<CompanyDashboard />} />
            <Route path="dashboard" element={<CompanyDashboard />} />
            <Route path="form-builder" element={<FormBuilder />} />
            <Route path="leads" element={<LeadViewer />} />
            <Route path="faqs" element={<FAQManager />} />
            <Route path="support" element={<SupportSettings />} />
            <Route path="widget" element={<WidgetManagement />} />
            <Route path="widget-settings" element={<WidgetSettings />} />
          </Route>
          
          {/* Analytics & Integrations */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Analytics />} />
          </Route>
          <Route path="/integrations" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Integrations />} />
          </Route>
          
          {/* Widget Routes */}
          <Route path="/widget" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="chat" element={<WidgetChat />} />
            <Route path="form" element={<WidgetForm />} />
          </Route>
          
          {/* Default redirect */}
          <Route path="/" element={<AuthRedirect />} />
          <Route path="*" element={<AuthRedirect />} />
        </Routes>

        {/* Global Chat Components - Accessible on every page */}
        {/* <FixedChatbotIcon 
          onClick={handleChatbotOpen}
          isVisible={true}
        /> */}
        
        {/* <CompanyChatbot 
          companyId={getCompanyId()}
          isVisible={showChatbot}
          onClose={handleChatbotClose}
        /> */}

<FixedChatbotIcon 
         onClick={handleChatbotOpen}
         isVisible={true}
      />

      {/* Company Chatbot */}
      <CompanyChatbot 
        companyId={localStorage.getItem('selectedCompanyId')}
        isVisible={showChatbot}
        onClose={handleChatbotClose}
      />


      </div>
    </AuthProvider>
  );
}

export default App;
