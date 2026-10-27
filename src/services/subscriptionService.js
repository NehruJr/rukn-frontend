import api from './api';

export const getMySubscription = async () => {
  const response = await api.get('/subscription');
  return response.data;
};

export const getAvailablePlans = async () => {
  const response = await api.get('/subscription/plans');
  return response.data;
};

export const requestPlanChange = async (payload) => {
  const response = await api.post('/subscription/request-change', payload);
  return response.data;
};

export const subscriptionService = {
  getMySubscription,
  getAvailablePlans,
  requestPlanChange
};

export default subscriptionService;
