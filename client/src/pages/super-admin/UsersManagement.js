import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  UserIcon,
  CogIcon,
  ExclamationTriangleIcon,
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const UsersManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [companyForms, setCompanyForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const limit = 10;

  // Fetch users data
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  // Fetch company forms when company changes
  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyForms();
    }
  }, [selectedCompany]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      const response = await api.get(`/super-admin/users?${params}`);
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/super-admin/users/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCompanyForms = async () => {
    try {
      const response = await api.get(`/super-admin/forms/company/${selectedCompany.id}`);
      setCompanyForms(response.data.data || []);
    } catch (error) {
      console.error('Error fetching company forms:', error);
    }
  };

  // Fetch companies for user creation/editing
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get(`${API_URL}/super-admin/companies`);
        setCompanies(response.data.data || []);
      } catch (error) {
        console.warn('Could not fetch companies:', error);
        setCompanies([]);
      }
    };

    if (showCreateModal || showEditModal) {
      fetchCompanies();
    }
  }, [showCreateModal, showEditModal]);

  // Create user mutation
  const createUser = async (formData) => {
    try {
      const response = await api.post('/super-admin/users', formData);
      toast.success('User created successfully!');
      setShowCreateModal(false);
      fetchUsers(); // Refresh the list
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
      throw error;
    }
  };

  // Update user mutation
  const updateUser = async (id, userData) => {
    try {
      const response = await api.put(`/super-admin/users/${id}`, userData);
      toast.success('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
      throw error;
    }
  };

  // Delete user mutation
  const deleteUser = async (id) => {
    try {
      const response = await api.delete(`/super-admin/users/${id}`);
      toast.success('User deleted successfully!');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
      throw error;
    }
  };

  // Toggle form status
  const toggleForm = async (formId, isActive) => {
    try {
      const response = await api.put(`/super-admin/forms/${formId}/toggle`, { isActive });
      toast.success(response.data.message);
      fetchCompanyForms(); // Refresh the list
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle form status');
      throw error;
    }
  };

  // Bulk toggle forms
  const bulkToggleForms = async (companyId, isActive, formIds = []) => {
    try {
      const response = await api.put(`/super-admin/forms/company/${companyId}/bulk-toggle`, { 
        isActive, 
        formIds 
      });
      toast.success(response.data.message);
      fetchCompanyForms(); // Refresh the list
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to bulk toggle forms');
      throw error;
    }
  };

  const handleCreateUser = (formData) => {
    createUser(formData);
  };

  const handleUpdateUser = (formData) => {
    updateUser(selectedUser.id, formData);
  };

  const handleDeleteUser = () => {
    deleteUser(selectedUser.id);
  };

  const handleManageForms = (user) => {
    if (user.company) {
      setSelectedCompany(user.company);
      setShowFormModal(true);
    } else {
      toast.error('User must be associated with a company to manage forms');
    }
  };

  const handleToggleForm = (formId, currentStatus) => {
    toggleForm(formId, !currentStatus);
  };

  const handleBulkToggleForms = (isActive, formIds = []) => {
    if (!selectedCompany?.id) return;
    
    bulkToggleForms(selectedCompany.id, isActive, formIds);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800';
      case 'company_admin':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading users</h3>
          <p className="mt-1 text-sm text-gray-500">{error.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="mt-1 text-sm text-gray-600">
          Manage all users across all companies
        </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Add New User
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-blue-500 rounded-xl shadow-lg">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-blue-700 truncate uppercase tracking-wider">Total Users</dt>
                  <dd className="text-2xl font-bold text-blue-900">{stats.totalUsers.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-green-700 truncate uppercase tracking-wider">Active Users</dt>
                  <dd className="text-2xl font-bold text-green-900">{stats.activeUsers.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-red-500 rounded-xl shadow-lg">
                  <XCircleIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-red-700 truncate uppercase tracking-wider">Inactive Users</dt>
                  <dd className="text-2xl font-bold text-red-900">{stats.inactiveUsers.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-purple-500 rounded-xl shadow-lg">
                  <UserPlusIcon className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-xs font-medium text-purple-700 truncate uppercase tracking-wider">Recent (30d)</dt>
                  <dd className="text-2xl font-bold text-purple-900">{stats.recentUsers.toLocaleString()}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Search Users</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm text-gray-900"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="company_admin">Company Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm text-gray-900"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading users...</p>
          </div>
        ) : users?.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <UsersIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {search || roleFilter || statusFilter 
                ? 'No users match your current filters. Try adjusting your search criteria.'
                : 'Get started by creating your first user account.'}
            </p>
            {!search && !roleFilter && !statusFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Create First User
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {users?.map((user, index) => (
                    <tr key={user.id} className="hover:bg-blue-50 transition-colors duration-200 group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                              <span className="text-sm font-bold text-white">
                                {`${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {`${user.firstName} ${user.lastName}`}
                            </div>
                            <div className="text-xs text-gray-600">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.company?.name || (
                            <span className="text-gray-400 italic">No Company</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.isActive)}`}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-xs text-gray-900">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : <span className="text-gray-400 italic">Never</span>
                          }
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                            className="inline-flex items-center p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 hover:text-blue-700 transition-all duration-200 hover:scale-105"
                            title="Edit User"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          {user.company && (
                            <button
                              onClick={() => handleManageForms(user)}
                              className="inline-flex items-center p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 hover:text-green-700 transition-all duration-200 hover:scale-105"
                              title="Manage Forms"
                            >
                              <ClipboardDocumentListIcon className="h-4 w-4" />
                            </button>
                          )}
                          {user.role !== 'super_admin' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteModal(true);
                              }}
                              className="inline-flex items-center p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-700 transition-all duration-200 hover:scale-105"
                              title="Delete User"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {/* This section was removed as per the edit hint to remove React Query */}
          </>
        )}
      </div>
      
      {/* Create User Modal */}
      {showCreateModal && (
        <UserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          title="Create New User"
          companies={companies}
          isLoading={false} // No longer using React Query loading state
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdateUser}
          title="Edit User"
          user={selectedUser}
          companies={companies}
          isLoading={false} // No longer using React Query loading state
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleDeleteUser}
          title="Delete User"
          message={`Are you sure you want to delete "${selectedUser.firstName} ${selectedUser.lastName}"? This action cannot be undone.`}
          isLoading={false} // No longer using React Query loading state
        />
      )}

      {/* Form Management Modal */}
      {showFormModal && selectedCompany && (
        <FormManagementModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          forms={companyForms?.forms || []}
          isLoading={false} // No longer using React Query loading state
          onToggleForm={handleToggleForm}
          onBulkToggle={handleBulkToggleForms}
          toggleLoading={false} // No longer using React Query loading state
          bulkLoading={false} // No longer using React Query loading state
        />
      )}
    </div>
  );
};

// User Modal Component
const UserModal = ({ isOpen, onClose, onSubmit, title, user = null, companies = [], isLoading = false }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || 'user',
    companyId: user?.companyId || '',
    isActive: user?.isActive !== undefined ? user.isActive : true,
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    
    // Don't send password if it's empty (for updates)
    if (!submitData.password && user) {
      delete submitData.password;
    }
    
    // Convert companyId to number or null
    submitData.companyId = submitData.companyId ? parseInt(submitData.companyId) : null;
    
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-auto transform transition-all duration-300 modal-enter">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required={!user}
                placeholder={user ? "Leave blank to keep current password" : "Enter password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">User Role</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
              >
                <option value="user">User</option>
                <option value="company_admin">Company Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2 uppercase tracking-wider">Company</label>
              <select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
              >
                <option value="">No Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {user && (
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-3 block text-sm font-semibold text-gray-900">
                  Active User Account
                </label>
              </div>
            )}
          </form>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              user ? 'Update User' : 'Create User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Delete Modal Component
const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, isLoading = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md mx-auto transform transition-all duration-300 modal-enter">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-t-2xl">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-2 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 text-sm leading-relaxed">{message}</p>
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <p className="text-xs text-red-800 font-medium">
                  This action cannot be undone. The user will be permanently removed from the system.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </div>
            ) : (
              'Delete User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Form Management Modal Component
const FormManagementModal = ({ 
  isOpen, 
  onClose, 
  company, 
  forms = [], 
  isLoading = false, 
  onToggleForm,
  onBulkToggle,
  toggleLoading = false,
  bulkLoading = false 
}) => {
  const [selectedForms, setSelectedForms] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const activeForms = forms.filter(form => form.isActive);
  const inactiveForms = forms.filter(form => !form.isActive);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedForms([]);
    } else {
      setSelectedForms(forms.map(form => form.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectForm = (formId) => {
    setSelectedForms(prev => {
      const newSelection = prev.includes(formId)
        ? prev.filter(id => id !== formId)
        : [...prev, formId];
      
      // Update select all state
      setSelectAll(newSelection.length === forms.length);
      return newSelection;
    });
  };

  const getFormTypeBadgeColor = (formType) => {
    switch (formType) {
      case 'contact':
        return 'bg-blue-100 text-blue-800';
      case 'support':
        return 'bg-yellow-100 text-yellow-800';
      case 'lead':
        return 'bg-green-100 text-green-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl mx-auto transform transition-all duration-300 modal-enter">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-green-500 rounded-xl shadow-lg">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Form Management - {company.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {activeForms.length} active • {inactiveForms.length} inactive • {forms.length} total
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading forms...</p>
            </div>
          ) : forms.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <DocumentTextIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                This company doesn't have any forms yet. Forms will appear here once they are created.
              </p>
            </div>
          ) : (
            <>
              {/* Bulk Actions */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="selectAll"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="selectAll" className="ml-3 text-sm font-medium text-gray-900">
                      Select All ({forms.length} forms)
                    </label>
                    {selectedForms.length > 0 && (
                      <span className="ml-3 text-sm text-gray-600">
                        {selectedForms.length} selected
                      </span>
                    )}
                  </div>
                  {selectedForms.length > 0 && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onBulkToggle(true, selectedForms)}
                        disabled={bulkLoading}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200"
                      >
                        {bulkLoading ? 'Processing...' : 'Activate Selected'}
                      </button>
                      <button
                        onClick={() => onBulkToggle(false, selectedForms)}
                        disabled={bulkLoading}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all duration-200"
                      >
                        {bulkLoading ? 'Processing...' : 'Deactivate Selected'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Forms List */}
              <div className="grid gap-4 max-h-96 overflow-y-auto">
                {forms.map((form) => (
                  <div
                    key={form.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      form.isActive 
                        ? 'border-green-200 bg-green-50 hover:bg-green-100' 
                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <input
                          type="checkbox"
                          checked={selectedForms.includes(form.id)}
                          onChange={() => handleSelectForm(form.id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-sm font-semibold text-gray-900">{form.name}</h4>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getFormTypeBadgeColor(form.formType)}`}>
                              {form.formType}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              form.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                form.isActive ? 'bg-green-400' : 'bg-red-400'
                              }`}></div>
                              {form.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {form.isPublished && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Published
                              </span>
                            )}
                          </div>
                          {form.description && (
                            <p className="text-xs text-gray-600 mt-1">{form.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{form.totalSubmissions || 0} submissions</span>
                            <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onToggleForm(form.id, form.isActive)}
                          disabled={toggleLoading}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                            form.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {toggleLoading ? '...' : (form.isActive ? 'Deactivate' : 'Activate')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;