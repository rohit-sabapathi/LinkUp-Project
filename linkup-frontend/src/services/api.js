import axios from 'axios';
import { toast } from 'react-hot-toast';

const BASE_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData properly
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('token', access);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // If refresh fails, clear auth state and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.detail || 
      (typeof error.response?.data === 'object' ? 
        Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ') : 
        error.response?.data) || 
      error.message || 
      'An error occurred';
    toast.error(errorMessage);
    return Promise.reject(error);
  }
);

export { api };

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login/', { email, password }),

  register: (userData) =>
    api.post('/auth/register/', userData, {
      headers: {
        'Content-Type': userData instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    }),

  logout: () =>
    api.post('/auth/logout/'),

  googleAuth: (token) =>
    api.post('/auth/google/', { token }),

  refreshToken: (refreshToken) =>
    api.post('/auth/refresh/', { refresh: refreshToken }),
};

export const userAPI = {
  getCurrentUser: () =>
    api.get('/auth/me/'),

  updateProfile: (userData) =>
    api.patch('/auth/me/', userData, {
      headers: {
        'Content-Type': userData instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    }),

  getUserProfile: (userId) =>
    api.get(`/auth/profile/${userId}/`),
};

// Add error handler helper
export const handleApiError = (error) => {
  console.error('API Error:', error);
  const message = error.response?.data?.error || 
    (typeof error.response?.data === 'object' ? 
      Object.entries(error.response.data)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ') : 
      error.response?.data) || 
    error.message || 
    'An error occurred';
  toast.error(message);
  throw error;
};
