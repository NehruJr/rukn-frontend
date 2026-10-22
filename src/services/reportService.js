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

const reportService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(startDate = null, endDate = null, country = null, branch = null) {
    const response = await api.get('/reports/dashboard', { 
      params: cleanParams({ startDate, endDate, country, branch }) 
    });
    return response.data;
  },
 
  /**
   * Get lead analytics
   */
  async getLeadAnalytics(startDate = null, endDate = null, country = null, branch = null) {
    const response = await api.get('/reports/leads', { 
      params: cleanParams({ startDate, endDate, country, branch }) 
    });
    return response.data;
  },
 
  /**
   * Get deal analytics
   */
  async getDealAnalytics(startDate = null, endDate = null, country = null, branch = null) {
    const response = await api.get('/reports/deals', { 
      params: cleanParams({ startDate, endDate, country, branch }) 
    });
    return response.data;
  },
 
  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(startDate = null, endDate = null, country = null, branch = null) {
    const response = await api.get('/reports/agents', { 
      params: cleanParams({ startDate, endDate, country, branch }) 
    });
    return response.data;
  },
 
  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(startDate = null, endDate = null, country = null, branch = null) {
    const response = await api.get('/reports/funnel', { 
      params: cleanParams({ startDate, endDate, country, branch }) 
    });
    return response.data;
  },
 
  /**
   * Get revenue reports
   */
  async getRevenueReports(startDate = null, endDate = null, country = null, branch = null) {
    const response = await api.get('/reports/revenue', { 
      params: cleanParams({ startDate, endDate, country, branch }) 
    });
    return response.data;
  }
};
 
export { reportService };
