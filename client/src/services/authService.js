import api from './api';

export const authService = {
  // Register a new user
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Logout user
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Get current user profile
  async getProfile() {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Refresh token
  async refreshToken() {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  }
};
