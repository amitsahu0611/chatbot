import React, { useState, useEffect, useContext } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  EyeIcon, 
  PencilIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { getValidCompanyId, getCurrentCompanyId } from '../../utils/companyUtils';

const LeadViewer = () => {
  const { companyId } = useContext(AuthContext); // Get companyId from context
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedLeads, setSelectedLeads] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    status: '',
    priority: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLeads: 0,
    limit: 10
  });

  // Lead form state
  const [leadData, setLeadData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Contact Form',
    status: 'New',
    priority: 'Medium',
    notes: ''
  });

  const sources = ['Contact Form', 'FAQ Chat', 'Support Request', 'Widget Form', 'Manual Entry'];
  const statuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];
  const priorities = ['Low', 'Medium', 'High', 'Urgent'];

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [filters, pagination.currentPage]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const currentCompanyId = getCurrentCompanyId();
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });

      // Add companyId for super admin context
      if (currentCompanyId) {
        params.append('companyId', currentCompanyId);
      }

      const response = await api.get(`/company-admin/lead-viewer?${params}`);
      setLeads(response.data.data.leads);
      setPagination(prev => ({
        ...prev,
        ...response.data.data.pagination
      }));
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const currentCompanyId = getCurrentCompanyId();
      const params = currentCompanyId ? `?companyId=${currentCompanyId}` : '';
      const response = await api.get(`/company-admin/lead-viewer/stats${params}`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateLead = () => {
    setLeadData({
      name: '',
      email: '',
      phone: '',
      source: 'Contact Form',
      status: 'New',
      priority: 'Medium',
      notes: ''
    });
    setIsCreating(true);
    setIsEditing(false);
    setSelectedLead(null);
  };

  const handleEditLead = (lead) => {
    setLeadData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      source: lead.source,
      status: lead.status,
      priority: lead.priority,
      notes: lead.notes || ''
    });
    setSelectedLead(lead);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleSaveLead = async () => {
    try {
      // Frontend validation
      if (!leadData.name && !leadData.email) {
        alert('Name or email is required');
        return;
      }
      
      if (leadData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Get company ID using utility function
      const finalCompanyId = getValidCompanyId(companyId);
      
      if (isEditing) {
        await api.put(`/company-admin/lead-viewer/${selectedLead._id}`, leadData);
      } else {
        // Add companyId to lead data for manual creation
        const leadDataWithCompany = {
          ...leadData,
          companyId: finalCompanyId
        };
        await api.post('/company-admin/lead-viewer', leadDataWithCompany);
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setSelectedLead(null);
      fetchLeads();
      fetchStats();
    } catch (error) {
      console.error('Error saving lead:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to save lead. Please try again.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // You can add a toast notification here
      alert(errorMessage);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/company-admin/lead-viewer/${leadId}`);
        fetchLeads();
        fetchStats();
      } catch (error) {
        console.error('Error deleting lead:', error);
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.post('/company-admin/lead-viewer/export', {
        format: 'csv',
        filters
      });
      
      // Create and download CSV file
      const csvContent = response.data.data.data.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      ).join('\n');
      
      const csvHeader = Object.keys(response.data.data.data[0]).join(',') + '\n';
      const csv = csvHeader + csvContent;
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.data.filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting leads:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Converted': 'bg-purple-100 text-purple-800',
      'Lost': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (isCreating || isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Lead' : 'Create New Lead'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {isEditing ? 'Update lead information' : 'Add a new lead to your database'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
                setSelectedLead(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLead}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Lead
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={leadData.name}
                  onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={leadData.email}
                  onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={leadData.phone}
                  onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={leadData.source}
                  onChange={(e) => setLeadData({ ...leadData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={leadData.status}
                  onChange={(e) => setLeadData({ ...leadData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={leadData.priority}
                  onChange={(e) => setLeadData({ ...leadData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={leadData.notes}
              onChange={(e) => setLeadData({ ...leadData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add any additional notes about this lead..."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Viewer</h1>
          <p className="mt-1 text-sm text-gray-500">
            View, filter, and manage leads from your chatbot forms
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            onClick={handleCreateLead}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>


      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Created Date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No leads found. Create your first lead to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        {lead.phone && <div className="text-sm text-gray-500">{lead.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lead.source}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(lead.priority)}`}>
                        {lead.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.lastContacted ? new Date(lead.lastContacted).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalLeads)} of{' '}
            {pagination.totalLeads} leads
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(pagination.totalPages, prev.currentPage + 1) }))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadViewer;
