import api from './api';

export const leadService = {
  // Get all leads
  getLeads: async (params = {}) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  // Get single lead
  getLead: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  // Create lead
  createLead: async (data) => {
    const response = await api.post('/leads', data);
    return response.data;
  },

  // Update lead
  updateLead: async (id, data) => {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  // Delete lead
  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  // Add activity
  addActivity: async (leadId, data) => {
    const response = await api.post(`/leads/${leadId}/activities`, data);
    return response.data;
  },

  // Add property to lead
  addPropertyToLead: async (leadId, propertyId, interest = 'medium') => {
    const response = await api.post(`/leads/${leadId}/properties`, { propertyId, interest });
    return response.data;
  },

  // Remove property from lead
  removePropertyFromLead: async (leadId, propertyId) => {
    const response = await api.delete(`/leads/${leadId}/properties/${propertyId}`);
    return response.data;
  }
};

export default leadService;
