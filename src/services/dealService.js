import api from './api';
 
const dealService = {
  /**
   * Get all deals with optional filters
   */
  async getDeals(params = {}) {
    const response = await api.get('/deals', { params });
    return response.data;
  },
 
  /**
   * Get deal pipeline view (deals grouped by stage)
   */
  async getPipeline(params = {}) {
    const response = await api.get('/deals/pipeline', { params });
    return response.data;
  },
 
  /**
   * Get single deal by ID
   */
  async getDeal(id) {
    const response = await api.get(`/deals/${id}`);
    return response.data;
  },
 
  /**
   * Create new deal
   */
  async createDeal(dealData) {
    const response = await api.post('/deals', dealData);
    return response.data;
  },
 
  /**
   * Update deal
   */
  async updateDeal(id, dealData) {
    const response = await api.put(`/deals/${id}`, dealData);
    return response.data;
  },
 
  /**
   * Update deal stage
   */
  async updateDealStage(id, stage, status = null) {
    const response = await api.patch(`/deals/${id}/stage`, { stage, status });
    return response.data;
  },
 
  /**
   * Delete deal
   */
  async deleteDeal(id) {
    const response = await api.delete(`/deals/${id}`);
    return response.data;
  }
};
 
export { dealService };
