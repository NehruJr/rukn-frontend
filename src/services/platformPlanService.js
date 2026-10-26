import platformApi from './platformApi';

export const platformPlanService = {
  getPlans: async (params = {}) => {
    const res = await platformApi.get('/plans', { params });
    return res.data;
  },

  getPlanById: async (id) => {
    const res = await platformApi.get(`/plans/${id}`);
    return res.data;
  },

  createPlan: async (payload) => {
    const res = await platformApi.post('/plans', payload);
    return res.data;
  },

  updatePlan: async (id, payload) => {
    const res = await platformApi.put(`/plans/${id}`, payload);
    return res.data;
  },

  deletePlan: async (id) => {
    const res = await platformApi.delete(`/plans/${id}`);
    return res.data;
  }
};
