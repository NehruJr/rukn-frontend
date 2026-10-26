import axios from 'axios';
import { usePlatformAuthStore } from '../store/platformAuthStore';

const platformBaseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/platform`
  : '/api/v1/platform';

const platformApi = axios.create({
  baseURL: platformBaseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Inject Bearer platformToken
platformApi.interceptors.request.use(
  (config) => {
    const { platformToken } = usePlatformAuthStore.getState();
    if (platformToken) {
      config.headers.Authorization = `Bearer ${platformToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency queue for platform silent refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: Silent refresh on 401 with redirect to /platform/login
platformApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return platformApi(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { platformRefreshToken, logout, refreshAuth } = usePlatformAuthStore.getState();

      if (!platformRefreshToken) {
        processQueue(error, null);
        isRefreshing = false;
        logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/platform/login') {
          window.location.href = '/platform/login';
        }
        return Promise.reject(error);
      }

      try {
        const data = await refreshAuth();
        const newToken = data.token;
        platformApi.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return platformApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        logout();
        if (typeof window !== 'undefined' && window.location.pathname !== '/platform/login') {
          window.location.href = '/platform/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { platformApi };
export default platformApi;
