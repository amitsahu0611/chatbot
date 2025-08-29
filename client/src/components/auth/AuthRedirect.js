import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthRedirect = () => {
  const { isAuthenticated, loading, userRole } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard based on role
  if (isAuthenticated) {
    if (userRole === 'super_admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    } else if (userRole === 'company_admin') {
      return <Navigate to="/company-admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If not authenticated, redirect to login
  return <Navigate to="/login" replace />;
};

export default AuthRedirect;
