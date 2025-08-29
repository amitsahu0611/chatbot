import React from 'react';

const UsersManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage all users across all companies
        </p>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Users Management</h3>
          <p className="text-gray-500">
            This page will contain the users management interface with user creation, editing, and role management.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsersManagement;
