import React from 'react';
import { useQuery } from 'react-query';
import {
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  PlusIcon,
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
  // Mock data - in real app, this would come from API
  const { data: stats, isLoading } = useQuery('companyStats', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      totalLeads: 234,
      totalForms: 8,
      totalFAQs: 45,
      totalConversations: 1567,
      leadsGrowth: 15.3,
      formsGrowth: 0,
      faqsGrowth: 8.7,
      conversationsGrowth: 12.4,
    };
  });

  const { data: recentLeads } = useQuery('recentLeads', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        source: 'Contact Form',
        status: 'New',
        timestamp: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.j@company.com',
        phone: '+1 (555) 987-6543',
        source: 'FAQ Chat',
        status: 'Contacted',
        timestamp: '2024-01-15T09:15:00Z',
      },
      {
        id: 3,
        name: 'Mike Wilson',
        email: 'mike.wilson@tech.com',
        phone: '+1 (555) 456-7890',
        source: 'Lead Form',
        status: 'Qualified',
        timestamp: '2024-01-15T08:45:00Z',
      },
      {
        id: 4,
        name: 'Emily Davis',
        email: 'emily.davis@startup.com',
        phone: '+1 (555) 321-0987',
        source: 'Contact Form',
        status: 'New',
        timestamp: '2024-01-15T08:20:00Z',
      },
      {
        id: 5,
        name: 'David Brown',
        email: 'david.brown@enterprise.com',
        phone: '+1 (555) 654-3210',
        source: 'FAQ Chat',
        status: 'Contacted',
        timestamp: '2024-01-15T07:30:00Z',
      },
    ];
  });

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Leads',
        data: [12, 19, 15, 25, 22, 30, 28],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Conversations',
        data: [45, 52, 48, 65, 58, 75, 70],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const leadSourceData = {
    labels: ['Contact Form', 'FAQ Chat', 'Lead Form', 'Widget'],
    datasets: [
      {
        data: [45, 25, 20, 10],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          change={stats.leadsGrowth}
          icon={UserGroupIcon}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Forms"
          value={stats.totalForms}
          change={stats.formsGrowth}
          icon={DocumentTextIcon}
          color="bg-green-500"
        />
        <StatCard
          title="FAQ Articles"
          value={stats.totalFAQs}
          change={stats.faqsGrowth}
          icon={QuestionMarkCircleIcon}
          color="bg-purple-500"
        />
        <StatCard
          title="Conversations"
          value={stats.totalConversations}
          change={stats.conversationsGrowth}
          icon={ChatBubbleLeftRightIcon}
          color="bg-yellow-500"
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
          <button className="flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium">
            <PlusIcon className="h-4 w-4 mr-1" />
            View all leads
          </button>
        </div>
        <div className="space-y-1">
          {recentLeads?.map((lead) => (
            <LeadItem key={lead.id} lead={lead} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Create Form
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
            Add FAQ
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
            Widget Settings
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            Export Leads
          </button>
        </div>
      </div>

      {/* Widget Preview */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Widget Preview</h3>
        <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chatbot Widget</h3>
            <p className="mt-1 text-sm text-gray-500">
              Your chatbot widget will appear here. Configure it in Widget Management.
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                Configure Widget
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;
