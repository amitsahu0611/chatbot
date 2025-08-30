import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { BuildingOfficeIcon, EyeIcon, PencilIcon, TrashIcon, PlusIcon, ChatBubbleLeftRightIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CompaniesManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showWidget, setShowWidget] = useState(false);
  const [widgetCompany, setWidgetCompany] = useState(null);
  const { user, setSelectedCompany: setAuthSelectedCompany } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/super-admin/companies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data || []);
      } else {
        toast.error('Failed to fetch companies');
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Error fetching companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (company) => {
    // Use the auth context to set selected company
    setAuthSelectedCompany(company.id, company.name);
    
    // Navigate to company admin dashboard
    navigate('/company-admin/dashboard');
    
    toast.success(`Switched to ${company.name}`);
  };

  const handleViewCompany = (company) => {
    handleCompanyClick(company);
  };

  const handlePreviewWidget = (company) => {
    setWidgetCompany(company);
    setShowWidget(true);
    toast.success(`Previewing widget for ${company.name}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all registered companies and their settings
          </p>
        </div>
        
        <div className="card">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading companies...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage all registered companies and their settings
          </p>
        </div>
        
        <button className="btn btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Company
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Companies</p>
              <p className="text-2xl font-semibold text-gray-900">{companies.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Companies</p>
              <p className="text-2xl font-semibold text-gray-900">
                {companies.filter(c => c.isActive).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Premium Plans</p>
              <p className="text-2xl font-semibold text-gray-900">
                {companies.filter(c => c.subscriptionPlan === 'premium' || c.subscriptionPlan === 'enterprise').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-semibold text-gray-900">
                {companies.filter(c => !c.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="card">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">All Companies</h3>
          
          {companies.length === 0 ? (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No companies</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new company.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div 
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              onClick={() => handleCompanyClick(company)}
                            >
                              {company.name}
                            </div>
                            <div className="text-sm text-gray-500">{company.domain || 'No domain'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{company.email}</div>
                        <div className="text-sm text-gray-500">{company.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.subscriptionPlan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                          company.subscriptionPlan === 'premium' ? 'bg-blue-100 text-blue-800' :
                          company.subscriptionPlan === 'basic' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {company.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleViewCompany(company)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Company Dashboard"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePreviewWidget(company)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Preview Widget"
                          >
                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Edit Company"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete Company"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Widget Preview Section */}
      {showWidget && widgetCompany && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Widget Preview - {widgetCompany.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Company ID: {widgetCompany.id}</span>
              <button
                onClick={() => setShowWidget(false)}
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
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                {widgetCompany.name} - Enhanced Chat Widget
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Previewing the enhanced chat widget for this company. Look for the floating button!
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Widget Active
                </span>
                <span>•</span>
                <span>Company: {widgetCompany.name}</span>
                <span>•</span>
                <span>Widget ID: widget_{widgetCompany.id}_demo</span>
              </div>
            </div>
            
            <div className="relative bg-white/50 rounded-lg p-4 border border-white/50 backdrop-blur-sm">
              <div className="text-center text-sm text-gray-600">
                <p>🎉 Previewing {widgetCompany.name}'s enhanced chat widget!</p>
                <p className="mt-1">Look for the beautiful floating button in the bottom-right corner.</p>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default CompaniesManagement;
