import api from './api';

const cleanParams = (params = {}) => {
  const result = {};
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      result[key] = val;
    }
  });
  return result;
};

export const dashboardService = {
  // Get dashboard statistics
  getStats: async (params = {}) => {
    const response = await api.get('/dashboard/stats', { params: cleanParams(params) });
    return response.data;
  },

  // Get recent leads
  getRecentLeads: async (limit = 5, params = {}) => {
    const response = await api.get('/dashboard/recent-leads', {
      params: cleanParams({ limit, ...params })
    });
    return response.data;
  },

  // Get unified agenda (overdue + today tasks, viewings, follow-ups)
  getAgenda: async (params = {}) => {
    const response = await api.get('/dashboard/agenda', { params: cleanParams(params) });
    return response.data;
  },

  // Get items needing attention (hot uncontacted, stale deals, unassigned)
  getAttention: async (params = {}) => {
    const response = await api.get('/dashboard/attention', { params: cleanParams(params) });
    return response.data;
  },

  // Get team performance leaderboard (managers and admins)
  getTeamLeaderboard: async (params = {}) => {
    const response = await api.get('/dashboard/team', { params: cleanParams(params) });
    return response.data;
  },

  // Get today's tasks (legacy compatibility)
  getTodaysTasks: async (params = {}) => {
    const response = await api.get('/dashboard/tasks', { params: cleanParams(params) });
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit = 10, params = {}) => {
    const response = await api.get('/dashboard/recent-activity', {
      params: cleanParams({ limit, ...params })
    });
    return response.data;
  }
};
