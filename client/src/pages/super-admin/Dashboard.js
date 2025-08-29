import React from 'react';
import { useQuery } from 'react-query';
import {
  BuildingOfficeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

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
  // Mock data - in real app, this would come from API
  const { data: stats, isLoading } = useQuery('superAdminStats', async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      totalCompanies: 156,
      totalUsers: 1247,
      totalConversations: 8923,
      totalRevenue: 45678,
      companiesGrowth: 12.5,
      usersGrowth: 8.3,
      conversationsGrowth: -2.1,
      revenueGrowth: 15.7,
    };
  });

  const { data: recentActivity } = useQuery('recentActivity', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        type: 'company_registered',
        company: 'TechCorp Solutions',
        user: 'john.doe@techcorp.com',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        type: 'user_created',
        company: 'Digital Innovations',
        user: 'jane.smith@digital.com',
        timestamp: '2024-01-15T09:15:00Z',
      },
      {
        id: 3,
        type: 'subscription_upgraded',
        company: 'Global Enterprises',
        user: 'admin@global.com',
        timestamp: '2024-01-15T08:45:00Z',
      },
      {
        id: 4,
        type: 'company_registered',
        company: 'StartupXYZ',
        user: 'founder@startupxyz.com',
        timestamp: '2024-01-15T08:20:00Z',
      },
      {
        id: 5,
        type: 'user_created',
        company: 'E-commerce Plus',
        user: 'manager@ecommerce.com',
        timestamp: '2024-01-15T07:30:00Z',
      },
    ];
  });

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Companies',
        data: [12, 19, 15, 25, 22, 30],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Users',
        data: [45, 52, 48, 65, 58, 75],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue ($)',
        data: [6500, 7200, 6800, 8900, 8200, 9500],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 4,
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
        default:
          return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    const getActivityText = (type, company, user) => {
      switch (type) {
        case 'company_registered':
          return `New company registered: ${company}`;
        case 'user_created':
          return `New user created in ${company}`;
        case 'subscription_upgraded':
          return `${company} upgraded their subscription`;
        default:
          return 'Activity recorded';
      }
    };

    return (
      <div className="flex items-start space-x-3 py-3">
        <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">
            {getActivityText(activity.type, activity.company, activity.user)}
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
          value={stats.totalCompanies}
          change={stats.companiesGrowth}
          icon={BuildingOfficeIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          change={stats.usersGrowth}
          icon={UsersIcon}
          color="bg-green-500"
        />
        <StatCard
          title="Total Conversations"
          value={stats.totalConversations}
          change={stats.conversationsGrowth}
          icon={ChatBubbleLeftRightIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          change={stats.revenueGrowth}
          icon={CurrencyDollarIcon}
          color="bg-yellow-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Overview</h3>
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <Bar data={revenueData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-1">
          {recentActivity?.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">
            View all activity →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <BuildingOfficeIcon className="h-5 w-5 mr-2" />
            Add Company
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <UsersIcon className="h-5 w-5 mr-2" />
            Create User
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            View Analytics
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            System Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
