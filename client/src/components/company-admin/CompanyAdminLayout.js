import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  QuestionMarkCircleIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import CompanyChatbot from '../widget/CompanyChatbot';
import FixedChatbotIcon from '../widget/FixedChatbotIcon';
import toast from 'react-hot-toast';

const CompanyAdminLayout = () => {
  const { user, logout, isAuthorized, clearSelectedCompany } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [showFixedIcon, setShowFixedIcon] = useState(true); // Always show the icon
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Get selected company info
  useEffect(() => {
    const companyId = localStorage.getItem('selectedCompanyId');
    const companyName = localStorage.getItem('selectedCompanyName');
    
    if (companyId && companyName) {
      setSelectedCompany({ id: companyId, name: companyName });
    } else if (user?.companyId) {
      // If no selected company but user has a companyId, use that
      setSelectedCompany({ id: user.companyId, name: user.companyName || 'Your Company' });
    }
  }, [user]);

  // Check if user is authorized to access company admin
  if (!isAuthorized('company_admin') && !isAuthorized('super_admin')) {
    return <Navigate to="/login" replace />;
  }

  // For super admin, check if a company is selected
  if (user?.role === 'super_admin' && !localStorage.getItem('selectedCompanyId')) {
    return <Navigate to="/company-selection" replace />;
  }

  const handleSwitchToSuperAdmin = () => {
    // Use the auth context to clear selected company
    clearSelectedCompany();
    
    // Navigate back to super admin
    navigate('/super-admin/dashboard');
    
    toast.success('Switched back to Super Admin view');
  };

  const handleSwitchCompany = () => {
    // Navigate to company selection
    navigate('/company-selection');
  };

  const navigation = [
    { name: 'Dashboard', href: '/company-admin/dashboard', icon: HomeIcon },
    { name: 'Form Builder', href: '/company-admin/form-builder', icon: DocumentTextIcon },
    { name: 'Lead Viewer', href: '/company-admin/leads', icon: UserGroupIcon },
    { name: 'FAQ Manager', href: '/company-admin/faqs', icon: QuestionMarkCircleIcon },
    { name: 'Support Settings', href: '/company-admin/support', icon: PhoneIcon },
    { name: 'Widget Management', href: '/company-admin/widget', icon: ChatBubbleLeftRightIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-lg font-semibold text-gray-900">Company Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Company Admin</h1>
              {selectedCompany && (
                <p className="text-sm text-gray-500 truncate">{selectedCompany.name}</p>
              )}
            </div>
          </div>
          
                     {/* Super Admin Switch Buttons */}
           {user?.role === 'super_admin' && (
             <div className="px-4 py-3 border-b border-gray-200 space-y-2">
               <button
                 onClick={handleSwitchCompany}
                 className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors duration-200"
               >
                 <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                 Switch Company
               </button>
               <button
                 onClick={handleSwitchToSuperAdmin}
                 className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors duration-200"
               >
                 <ArrowLeftIcon className="h-4 w-4 mr-2" />
                 Back to Super Admin
               </button>
             </div>
           )}
          
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                {user?.role === 'super_admin' && (
                  <p className="text-xs text-blue-600 font-medium">Super Admin</p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h2>
              {selectedCompany && (
                <span className="ml-3 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                  <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                  {selectedCompany.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Chatbot */}
      {showFixedIcon && (
        <FixedChatbotIcon
          onClick={() => setShowChatbot(true)}
          companyId={selectedCompany?.id || user?.companyId}
        />
      )}
      
      {showChatbot && (
        <CompanyChatbot
          companyId={selectedCompany?.id || user?.companyId}
          onClose={() => setShowChatbot(false)}
        />
      )}
    </div>
  );
};

export default CompanyAdminLayout;
