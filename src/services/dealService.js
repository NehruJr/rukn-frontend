import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const dealService = {
  /**
   * Get all deals with optional filters
   */
  async getDeals(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/deals?${params.toString()}`);
    return response.data;
  },

  /**
   * Get deal pipeline view (deals grouped by stage)
   */
  async getPipeline(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const response = await axios.get(`${API_URL}/deals/pipeline?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single deal by ID
   */
  async getDeal(id) {
    const response = await axios.get(`${API_URL}/deals/${id}`);
    return response.data;
  },

  /**
   * Create new deal
   */
  async createDeal(dealData) {
    const response = await axios.post(`${API_URL}/deals`, dealData);
    return response.data;
  },

  /**
   * Update deal
   */
  async updateDeal(id, dealData) {
    const response = await axios.put(`${API_URL}/deals/${id}`, dealData);
    return response.data;
  },

  /**
   * Update deal stage
   */
  async updateDealStage(id, stage, status = null) {
    const response = await axios.patch(`${API_URL}/deals/${id}/stage`, { stage, status });
    return response.data;
  },

  /**
   * Delete deal
   */
  async deleteDeal(id) {
    const response = await axios.delete(`${API_URL}/deals/${id}`);
    return response.data;
  }
};

export { dealService };
