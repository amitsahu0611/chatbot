import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  BuildingOfficeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EyeIcon,
  PlusIcon,
  PlayIcon,
  StopIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminDashboard = () => {
  const [showWidget, setShowWidget] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch stats
      const statsResponse = await api.get('/super-admin/dashboard/stats');
      setStats(statsResponse.data.data);
      
      // Fetch recent activity
      const activityResponse = await api.get('/super-admin/dashboard/activity?limit=10');
      setRecentActivity(activityResponse.data.data);
      
      // Fetch chart data
      const chartResponse = await api.get('/super-admin/dashboard/charts?months=6');
      setChartData(chartResponse.data.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare chart data from API response
  const growthChartData = chartData ? {
    labels: chartData.map(item => item.month),
    datasets: [
      {
        label: 'Companies',
        data: chartData.map(item => item.companies),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Users',
        data: chartData.map(item => item.users),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  } : { labels: [], datasets: [] };

  const activityChartData = chartData ? {
    labels: chartData.map(item => item.month),
    datasets: [
      {
        label: 'Leads',
        data: chartData.map(item => item.leads),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
      },
      {
        label: 'Form Submissions',
        data: chartData.map(item => item.submissions),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 4,
      },
    ],
  } : { labels: [], datasets: [] };

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
        <span className="ml-1 text-sm text-gray-500">from last month</span>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'company_registered':
          return <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />;
        case 'user_created':
          return <UsersIcon className="h-5 w-5 text-green-500" />;
        case 'subscription_upgraded':
          return <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />;
        case 'lead_created':
          return <ChatBubbleLeftRightIcon className="h-5 w-5 text-purple-500" />;
        case 'form_submitted':
          return <ChartBarIcon className="h-5 w-5 text-indigo-500" />;
        default:
          return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    const getActivityText = (type, company, user, metadata = {}) => {
      switch (type) {
        case 'company_registered':
          return `New company registered: ${company}`;
        case 'user_created':
          return `New user ${metadata.name || user} created in ${company}`;
        case 'subscription_upgraded':
          return `${company} upgraded their subscription`;
        case 'lead_created':
          return `New lead created in ${company}: ${user}`;
        case 'form_submitted':
          return `Form "${metadata.formName || 'Unknown'}" submitted in ${company}`;
        default:
          return 'Activity recorded';
      }
    };

    return (
      <div className="flex items-start space-x-3 py-3">
        <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            {getActivityText(activity.type, activity.company, activity.user, activity.metadata)}
          </p>
          <p className="text-sm text-gray-500">
            {new Date(activity.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.168 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
          <div className="mt-6">
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of all companies, users, and platform activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Companies"
          value={stats?.totalCompanies || 0}
          change={stats?.companiesGrowth || 0}
          icon={BuildingOfficeIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          change={stats?.usersGrowth || 0}
          icon={UsersIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          change={stats?.leadsGrowth || 0}
          icon={ChatBubbleLeftRightIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Active Widgets"
          value={stats?.totalActiveWidgets || 0}
          change={0}
          icon={CurrencyDollarIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Overview</h3>
          {growthChartData.labels.length > 0 ? (
            <Line data={growthChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <span>No chart data available</span>
            </div>
          )}
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Trend</h3>
          {activityChartData.labels.length > 0 ? (
            <Bar data={activityChartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <span>No chart data available</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-1">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <span>No recent activity available</span>
            </div>
          )}
        </div>
        {recentActivity && recentActivity.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              View all activity →
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button 
            onClick={() => navigate('/super-admin/companies')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Manage Companies
          </button>
          <button 
            onClick={() => navigate('/super-admin/users')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Manage Users
          </button>
          <button 
            onClick={() => navigate('/super-admin/analytics')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <ChartBarIcon className="h-5 w-5 mr-2" />
            View Analytics
          </button>
          <button 
            onClick={() => navigate('/super-admin/settings')}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            System Settings
          </button>
        </div>
      </div>

      {/* Enhanced Widget Demo */}
      {/* <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Enhanced Widget Demo</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Demo Company ID: 1</span>
            <button
              onClick={() => setShowWidget(!showWidget)}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                showWidget
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {showWidget ? (
                <>
                  <StopIcon className="w-3 h-3 mr-1" />
                  Hide Demo
                </>
              ) : (
                <>
                  <PlayIcon className="w-3 h-3 mr-1" />
                  Show Demo
                </>
              )}
            </button>
          </div>
        </div>
        
        {showWidget ? (
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-dashed border-blue-300">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Enhanced Chat Widget Demo</h4>
              <p className="text-sm text-gray-600 mb-4">
                Experience the enhanced chat widget that companies can use on their websites.
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Demo Active
                </span>
                <span>•</span>
                <span>Company ID: 1</span>
                <span>•</span>
                <span>Widget ID: widget_1_demo</span>
              </div>
            </div>
            
            <div className="relative bg-white/50 rounded-lg p-4 border border-white/50 backdrop-blur-sm">
              <div className="text-center text-sm text-gray-600">
                <p>🎉 Enhanced chat widget demo is now active!</p>
                <p className="mt-1">Look for the beautiful floating button in the bottom-right corner.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Enhanced Widget Demo</h3>
              <p className="mt-1 text-sm text-gray-500">
                Click "Show Demo" to experience the enhanced chat widget that companies can use.
              </p>
              <div className="mt-6">
                <button 
                  onClick={() => setShowWidget(true)}
                  className="btn-primary"
                >
                  Show Widget Demo
                </button>
              </div>
            </div>
          </div>
        )}
      </div> */}


    </div>
  );
};

export default SuperAdminDashboard;
