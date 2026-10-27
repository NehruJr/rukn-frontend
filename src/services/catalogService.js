import api from './api';

export const catalogService = {
  // Get current authenticated agency's catalog link, settings, and property counts
  getMyCatalogInfo: async () => {
    const response = await api.get('/catalog/my-catalog');
    return response.data;
  },

  // Get public agency catalog & properties (no auth required)
  getPublicCatalog: async (slug, filters = {}) => {
    const response = await api.get(`/catalog/${encodeURIComponent(slug)}`, { params: filters });
    return response.data;
  },

  // Submit public visitor inquiry to agency CRM (no auth required)
  submitInquiry: async (slug, payload) => {
    const response = await api.post(`/catalog/${encodeURIComponent(slug)}/inquiries`, payload);
    return response.data;
  }
};

export default catalogService;
