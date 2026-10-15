import api from './api';

export const tourService = {
  // Create virtual tour
  createTour: async (tourData) => {
    const response = await api.post('/tours', tourData);
    return response.data;
  },

  // Get virtual tour by ID
  getTourById: async (id) => {
    const response = await api.get(`/tours/${id}`);
    return response.data;
  },

  // Get virtual tour by property ID
  getTourByProperty: async (propertyId) => {
    const response = await api.get(`/tours/property/${propertyId}`);
    return response.data;
  },

  // Update virtual tour
  updateTour: async (id, tourData) => {
    const response = await api.put(`/tours/${id}`, tourData);
    return response.data;
  },

  // Delete virtual tour
  deleteTour: async (id) => {
    const response = await api.delete(`/tours/${id}`);
    return response.data;
  },

  // Get public tour by share token
  getPublicTour: async (token) => {
    const response = await api.get(`/tours/public/${token}`);
    return response.data;
  }
};

export default tourService;
