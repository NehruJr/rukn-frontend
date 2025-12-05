import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const reportService = {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(`${API_URL}/reports/dashboard?${params.toString()}`);
    return response.data;
  },

  /**
   * Get lead analytics
   */
  async getLeadAnalytics(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(`${API_URL}/reports/leads?${params.toString()}`);
    return response.data;
  },

  /**
   * Get deal analytics
   */
  async getDealAnalytics(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(`${API_URL}/reports/deals?${params.toString()}`);
    return response.data;
  },

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(`${API_URL}/reports/agents?${params.toString()}`);
    return response.data;
  },

  /**
   * Get conversion funnel data
   */
  async getConversionFunnel(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(`${API_URL}/reports/funnel?${params.toString()}`);
    return response.data;
  },

  /**
   * Get revenue reports
   */
  async getRevenueReports(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await axios.get(`${API_URL}/reports/revenue?${params.toString()}`);
    return response.data;
  }
};

export { reportService };
