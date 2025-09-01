import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const CompanySelection = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/api/super-admin/companies`, {
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

  const handleCompanySelect = (company) => {
    // Store company ID in localStorage
    localStorage.setItem('selectedCompanyId', company.id);
    localStorage.setItem('selectedCompanyName', company.name);
    
    // Navigate to company admin dashboard
    navigate('/company-admin/dashboard');
    
    toast.success(`Selected ${company.name}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, Super Admin!</h1>
          <p className="text-gray-600">Please select a company to manage</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Company</h2>
          
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No companies available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className="w-full flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 text-left"
                >
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500">{company.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            You can switch companies anytime from the sidebar
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanySelection;
