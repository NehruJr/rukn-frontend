import api from './api';
 
const reportService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(startDate = null, endDate = null) {
    const response = await api.get('/reports/dashboard', { 
      params: { startDate, endDate } 
    });
    return response.data;
  },
 
  /**
   * Get lead analytics
   */
  async getLeadAnalytics(startDate = null, endDate = null) {
    const response = await api.get('/reports/leads', { 
      params: { startDate, endDate } 
    });
    return response.data;
  },
 
  /**
   * Get deal analytics
   */
  async getDealAnalytics(startDate = null, endDate = null) {
    const response = await api.get('/reports/deals', { 
      params: { startDate, endDate } 
    });
    return response.data;
  },
 
  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(startDate = null, endDate = null) {
    const response = await api.get('/reports/agents', { 
      params: { startDate, endDate } 
    });
    return response.data;
  },
 
  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(startDate = null, endDate = null) {
    const response = await api.get('/reports/funnel', { 
      params: { startDate, endDate } 
    });
    return response.data;
  },
 
  /**
   * Get revenue reports
   */
  async getRevenueReports(startDate = null, endDate = null) {
    const response = await api.get('/reports/revenue', { 
      params: { startDate, endDate } 
    });
    return response.data;
  }
};
 
export { reportService };
