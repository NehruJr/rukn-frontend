import platformApi from './platformApi';

export const platformOrgService = {
  getOrganizations: async (params = {}) => {
    const res = await platformApi.get('/organizations', { params });
    return res.data;
  },

  getOrganization: async (id) => {
    const res = await platformApi.get(`/organizations/${id}`);
    return res.data;
  },

  createOrganization: async (payload) => {
    const res = await platformApi.post('/organizations', payload);
    return res.data;
  },

  updateOrganization: async (id, payload) => {
    const res = await platformApi.put(`/organizations/${id}`, payload);
    return res.data;
  },

  toggleStatus: async (id, { isActive, reason }) => {
    const res = await platformApi.patch(`/organizations/${id}/status`, { isActive, reason });
    return res.data;
  },

  assignPlan: async (id, payload) => {
    const res = await platformApi.post(`/organizations/${id}/plan`, payload);
    return res.data;
  },

  impersonate: async (id) => {
    const res = await platformApi.post(`/organizations/${id}/impersonate`);
    return res.data;
  },

  getPayments: async (id) => {
    const res = await platformApi.get(`/organizations/${id}/payments`);
    return res.data;
  },

  recordPayment: async (id, payload) => {
    const res = await platformApi.post(`/organizations/${id}/payments`, payload);
    return res.data;
  },

  getUsers: async (id) => {
    const res = await platformApi.get(`/organizations/${id}/users`);
    return res.data;
  },

  toggleUserStatus: async (id, userId, { isActive }) => {
    const res = await platformApi.patch(`/organizations/${id}/users/${userId}/status`, { isActive });
    return res.data;
  }
};
