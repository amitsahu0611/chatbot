import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { setCompanyId, removeCompanyId } from '../utils/companyUtils';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  userRole: null, // 'super_admin', 'company_admin', 'user'
  companyId: localStorage.getItem('companyId'), // Add companyId from localStorage
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        userRole: action.payload.user.role,
        companyId: action.payload.user.companyId, // Add companyId to state
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        userRole: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        userRole: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_SELECTED_COMPANY':
      return {
        ...state,
        selectedCompanyId: action.payload.companyId,
        selectedCompanyName: action.payload.companyName,
      };
    case 'CLEAR_SELECTED_COMPANY':
      return {
        ...state,
        selectedCompanyId: null,
        selectedCompanyName: null,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token with backend
          const response = await authService.getProfile();
          
          if (response.success) {
                    // For super admin (company_id = null), don't set companyId
        if (response.data.user.role === 'super_admin') {
          // Super admin can access all companies
          console.log('Super admin logged in - can access all companies');
        } else {
          // Regular company admin - set their company ID
          setCompanyId(response.data.user.companyId);
        }
            
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.data.user,
                token: token,
              },
            });
          } else {
            localStorage.removeItem('token');
            removeCompanyId(); // Remove companyId using utility function
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          removeCompanyId(); // Remove companyId using utility function
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await authService.login({ email, password });

      if (response.success) {
        localStorage.setItem('token', response.data.token);
        
        // For super admin (company_id = null), don't set companyId
        if (response.data.user.role === 'super_admin') {
          console.log('Super admin logged in - can access all companies');
        } else {
          // Regular company admin - set their company ID
          setCompanyId(response.data.user.companyId);
        }
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: response.data.user,
            token: response.data.token,
          },
        });
        
        toast.success('Login successful!');
        
        // Redirect super admin to company selection
        if (response.data.user.role === 'super_admin') {
          window.location.href = '/company-selection';
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error(error.response?.data?.message || 'Network error. Please try again.');
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);

      if (response.success) {
        toast.success('Registration successful! Please login.');
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Network error. Please try again.');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    removeCompanyId(); // Remove companyId using utility function
    // Also clear selected company
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('selectedCompanyName');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  const setSelectedCompany = (companyId, companyName) => {
    localStorage.setItem('selectedCompanyId', companyId);
    localStorage.setItem('selectedCompanyName', companyName);
    dispatch({
      type: 'SET_SELECTED_COMPANY',
      payload: { companyId, companyName }
    });
  };

  const clearSelectedCompany = () => {
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('selectedCompanyName');
    dispatch({ type: 'CLEAR_SELECTED_COMPANY' });
  };

  const isAuthorized = (requiredRole) => {
    if (!state.isAuthenticated) return false;
    if (!requiredRole) return true;
    
    // Super admin has access to everything
    if (state.userRole === 'super_admin') return true;
    
    // Check specific role requirements
    return state.userRole === requiredRole;
  };

  const getCurrentCompanyId = () => {
    // If super admin has selected a company, use that
    const selectedCompanyId = localStorage.getItem('selectedCompanyId');
    if (selectedCompanyId) {
      return parseInt(selectedCompanyId);
    }
    
    // Otherwise use the user's company ID
    return state.companyId;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    isAuthorized,
    setSelectedCompany,
    clearSelectedCompany,
    getCurrentCompanyId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export AuthContext for direct usage if needed
export { AuthContext };
