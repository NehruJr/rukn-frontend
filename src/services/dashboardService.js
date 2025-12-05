import api from './api';

export const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get recent leads
  getRecentLeads: async (limit = 5) => {
    const response = await api.get('/dashboard/recent-leads', { params: { limit } });
    return response.data;
  },

  // Get today's tasks
  getTodaysTasks: async () => {
    const response = await api.get('/dashboard/tasks');
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    const response = await api.get('/dashboard/recent-activity', { params: { limit } });
    return response.data;
  }
};
