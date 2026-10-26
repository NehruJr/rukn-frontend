import platformApi from './platformApi';

export const platformAIService = {
  getSummary: async (params = {}) => {
    const res = await platformApi.get('/ai-analytics/summary', { params });
    return res.data;
  },

  getByTool: async (params = {}) => {
    const res = await platformApi.get('/ai-analytics/by-tool', { params });
    return res.data;
  },

  getDaily: async (params = {}) => {
    const res = await platformApi.get('/ai-analytics/daily', { params });
    return res.data;
  },

  getTopOrganizations: async (params = {}) => {
    const res = await platformApi.get('/ai-analytics/top-organizations', { params });
    return res.data;
  }
};
