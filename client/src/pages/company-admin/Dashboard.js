import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

import {
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/react/24/outline';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CompanyDashboard = () => {
  const { user, getCurrentCompanyId } = useAuth();
  const navigate = useNavigate();
  const [showWidget, setShowWidget] = useState(false);
  const companyId = getCurrentCompanyId();
  
  // Fetch real dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    ['dashboardStats', companyId], 
    async () => {
      const response = await api.get(`/company-admin/dashboard/stats?companyId=${companyId}`);
      return response.data.data;
    },
    {
      enabled: !!companyId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Extract data from dashboard response
  const stats = dashboardData?.stats || {};
  const recentLeads = dashboardData?.recentLeads || [];
  const leadSources = dashboardData?.leadSources || {};
  const weeklyActivity = dashboardData?.weeklyActivity || { labels: [], leads: [], conversations: [] };

  const chartData = {
    labels: weeklyActivity.labels.length > 0 ? weeklyActivity.labels : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Leads',
        data: weeklyActivity.leads.length > 0 ? weeklyActivity.leads : [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Conversations',
        data: weeklyActivity.conversations.length > 0 ? weeklyActivity.conversations : [0, 0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const leadSourceLabels = Object.keys(leadSources);
  const leadSourceValues = Object.values(leadSources);
  
  const leadSourceData = {
    labels: leadSourceLabels.length > 0 ? leadSourceLabels : ['No Data'],
    datasets: [
      {
        data: leadSourceValues.length > 0 ? leadSourceValues : [1],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const StatCard = ({ title, value, change, icon: Icon, color }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center">
        {change >= 0 ? (
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        )}
        <span
          className={`ml-1 text-sm font-medium ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {Math.abs(change)}%
        </span>
        <span className="ml-1 text-sm text-gray-500">from last week</span>
      </div>
    </div>
  );

  // Quick Actions handlers
  const handleCreateForm = () => {
    navigate('/company-admin/form-builder');
  };

  const handleAddFAQ = () => {
    navigate('/company-admin/faqs');
  };

  const handleWidgetSettings = () => {
    navigate('/company-admin/widget');
  };

  const handleExportLeads = async () => {
    try {
      const response = await api.post('/company-admin/lead-viewer/export', {
        format: 'csv',
        filters: {} // Export all leads
      });
      
      // Create and download CSV file
      const csvContent = response.data.data.csvData;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting leads:', error);
      alert('Failed to export leads. Please try again.');
    }
  };

  const LeadItem = ({ lead }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {lead.name.charAt(0)}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
          <p className="text-sm text-gray-500">{lead.email}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          lead.status === 'New' ? 'bg-blue-100 text-blue-800' :
          lead.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {lead.status}
        </span>
        <span className="text-sm text-gray-500">{lead.source}</span>
        <button className="text-gray-400 hover:text-gray-600">
          <EyeIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Company Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your chatbot performance and lead generation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads || 0}
          change={stats.leadsGrowth || 0}
          icon={UserGroupIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Forms"
          value={stats.totalForms || 0}
          change={stats.formsGrowth || 0}
          icon={DocumentTextIcon}
          color="bg-green-500"
        />
        <StatCard
          title="FAQ Articles"
          value={stats.totalFAQs || 0}
          change={stats.faqsGrowth || 0}
          icon={QuestionMarkCircleIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Conversations"
          value={stats.totalConversations || 0}
          change={stats.conversationsGrowth || 0}
          icon={ChatBubbleLeftRightIcon}
          color="bg-yellow-500"
        />
        <StatCard
          title="Unanswered Queries"
          value={stats.unansweredQueries || 0}
          change={0} // No growth calculation for this
          icon={ExclamationTriangleIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Activity</h3>
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Sources</h3>
          <Doughnut data={leadSourceData} options={doughnutOptions} />
        </div>
      </div>

      {/* Recent Leads */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Leads</h3>
          <button 
            onClick={() => navigate('/company-admin/leads')}
            className="flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            View all leads
          </button>
        </div>
        <div className="space-y-1">
          {recentLeads && recentLeads.length > 0 ? (
            recentLeads.map((lead) => (
              <LeadItem key={lead.id} lead={lead} />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm">No recent leads found</p>
              <p className="text-xs text-gray-400">Leads will appear here when customers interact with your chatbot</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button 
            onClick={handleCreateForm}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Create Form
          </button>
          <button 
            onClick={handleAddFAQ}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
            Add FAQ
          </button>
          <button 
            onClick={handleWidgetSettings}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Widget Settings
          </button>
          <button 
            onClick={handleExportLeads}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Export Leads
          </button>
        </div>
      </div>

      {/* Enhanced Widget Preview */}



    </div>
  );
};

export default CompanyDashboard;
