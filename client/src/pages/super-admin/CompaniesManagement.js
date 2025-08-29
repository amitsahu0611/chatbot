import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BuildingOfficeIcon, EyeIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CompaniesManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
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
    </div>
  );
};

export default CompaniesManagement;
