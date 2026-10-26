import platformApi from './platformApi';

export const platformStaffService = {
  getStaffList: async (params = {}) => {
    const response = await platformApi.get('/staff', { params });
    return response.data;
  },

  createStaff: async (staffData) => {
    const response = await platformApi.post('/staff', staffData);
    return response.data;
  },

  updateStaff: async (id, staffData) => {
    const response = await platformApi.patch(`/staff/${id}`, staffData);
    return response.data;
  },

  deleteStaff: async (id) => {
    const response = await platformApi.delete(`/staff/${id}`);
    return response.data;
  }
};

export default platformStaffService;
