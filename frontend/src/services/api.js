import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboard: async () => {
    try {
      console.log('Fetching dashboard data...');
      const response = await api.get('/admin/dashboard');
      console.log('Dashboard response:', response.data);
      return response;
    } catch (error) {
      console.error('Dashboard API error:', error);
      throw error;
    }
  },

  // Users
  getUsers: async (params) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response;
    } catch (error) {
      console.error('Get users API error:', error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response;
    } catch (error) {
      console.error('Create user API error:', error);
      throw error;
    }
  },

  // Stores
  getStores: async (params) => {
    try {
      const response = await api.get('/admin/stores', { params });
      return response;
    } catch (error) {
      console.error('Get stores API error:', error);
      throw error;
    }
  },

  createStore: async (storeData) => {
    try {
      const response = await api.post('/admin/stores', storeData);
      return response;
    } catch (error) {
      console.error('Create store API error:', error);
      throw error;
    }
  },
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      console.error('Register API error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response;
    } catch (error) {
      console.error('Logout API error:', error);
      throw error;
    }
  },
};

//User API
export const userAPI = {
  getStores: async (params) => {
    try {
      const response = await api.get('/user/stores', { params });
      return response;
    } catch (error) {
      console.error('Get user stores API error:', error);
      throw error;
    }
  },

  submitRating: async (storeId, ratingData) => {
    try {
      const response = await api.post(`/user/stores/${storeId}/rating`, ratingData);
      return response;
    } catch (error) {
      console.error('Submit rating API error:', error);
      throw error;
    }
  },

  updateRating: async (storeId, ratingData) => {
    try {
      const response = await api.put(`/user/stores/${storeId}/rating`, ratingData);
      return response;
    } catch (error) {
      console.error('Update rating API error:', error);
      throw error;
    }
  },

  getUserStats: async () => {
    try {
      const response = await api.get('/user/stats');
      return response;
    } catch (error) {
      console.error('Get user stats API error:', error);
      throw error;
    }
  },

  getMyRatings: async (params) => {
    try {
      const response = await api.get('/user/my-ratings', { params });
      return response;
    } catch (error) {
      console.error('Get my ratings API error:', error);
      throw error;
    }
  },

  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/update-password', passwordData);
      return response;
    } catch (error) {
      console.error('Update password API error:', error);
      throw error;
    }
  }
};

// Store Owner API
export const storeAPI = {
  getDashboard: async () => {
    try {
      const response = await api.get('/store/dashboard');
      return response;
    } catch (error) {
      console.error('Store dashboard API error:', error);
      throw error;
    }
  },

  getRatings: async (params) => {
    try {
      const response = await api.get('/store/ratings', { params });
      return response;
    } catch (error) {
      console.error('Get store ratings API error:', error);
      throw error;
    }
  },

  // Additional method for updating store owner password
  updatePassword: async (passwordData) => {
    try {
      const response = await api.put('/store/password', passwordData);
      return response;
    } catch (error) {
      console.error('Update store password API error:', error);
      throw error;
    }
  },

  // Get store owner profile information
  getProfile: async () => {
    try {
      const response = await api.get('/store/profile');
      return response;
    } catch (error) {
      console.error('Get store profile API error:', error);
      throw error;
    }
  }
};


export default api;
