import api from './api';
import { useAuthStore } from '@/store/authStore';

export const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/auth/updatedetails', data);
    return response.data;
  },

  // Update password
  updatePassword: async (data) => {
    const response = await api.put('/auth/updatepassword', data);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgotpassword', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  },

  // Logout
  logout: async () => {
    try {
      await api.get('/auth/logout');
    } finally {
      useAuthStore.getState().logout();
    }
  }
};

export default authService;
