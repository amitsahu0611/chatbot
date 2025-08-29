import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, loading, userRole } = useAuth();
  const location = useLocation();

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

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is required and user doesn't have it, redirect to appropriate dashboard
  if (requiredRole && userRole !== requiredRole) {
    // Super admin can access company admin routes
    if (userRole === 'super_admin' && requiredRole === 'company_admin') {
      return children;
    }
    
    // Redirect to user's appropriate dashboard based on their role
    if (userRole === 'super_admin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    } else if (userRole === 'company_admin') {
      return <Navigate to="/company-admin/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
