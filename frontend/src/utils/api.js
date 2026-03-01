import axios from 'axios';
import { API_URL } from './constants';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bharat_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bharat_token');
      localStorage.removeItem('bharat_user');
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  checkWallet: (walletAddress) => api.get(`/auth/check/${walletAddress}`),
  register: (data) => api.post('/auth/register', data),
  getNonce: (walletAddress) => api.get(`/auth/nonce/${walletAddress}`),
  verify: (walletAddress, signature) => api.post('/auth/verify', { walletAddress, signature }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  linkWallet: (walletAddress, label) => api.post('/auth/link-wallet', { walletAddress, label }),
};

// Documents
export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyDocuments: () => api.get('/documents/my'),
  verifyDocument: (hash) => api.get(`/documents/verify/${hash}`),
  downloadDocument: (hash) => api.get(`/documents/${hash}/download`, { responseType: 'blob' }),
  getPropertyDocuments: (propertyId) => api.get(`/documents/property/${propertyId}`),
};

// Properties
export const propertyAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getByOwner: (walletAddress) => api.get(`/properties/owner/${walletAddress}`),
  sync: (propertyId, data) => api.post(`/properties/sync/${propertyId}`, data),
  search: (params) => api.get('/properties/search/query', { params }),
  getStats: () => api.get('/properties/stats/overview'),
};

// Transfers
export const transferAPI = {
  getAll: (params) => api.get('/transfers', { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  getByUser: (walletAddress) => api.get(`/transfers/user/${walletAddress}`),
  getByProperty: (propertyId) => api.get(`/transfers/property/${propertyId}`),
  sync: (transferId, data) => api.post(`/transfers/sync/${transferId}`, data),
  getStats: () => api.get('/transfers/stats/overview'),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getPendingUsers: () => api.get('/admin/users/pending'),
  verifyUser: (walletAddress, approved, reason) =>
    api.put(`/admin/users/${walletAddress}/verify`, { approved, reason }),
  updateUserRole: (walletAddress, role) =>
    api.put(`/admin/users/${walletAddress}/role`, { role }),
  getPendingProperties: () => api.get('/admin/properties/pending'),
  verifyProperty: (propertyId, approved, reason) =>
    api.put(`/admin/properties/${propertyId}/verify`, { approved, reason }),
  getPendingDocuments: () => api.get('/admin/documents/pending'),
  verifyDocument: (hash, approved, reason, notes) =>
    api.put(`/admin/documents/${hash}/verify`, { approved, reason, notes }),
  getTransfers: (params) => api.get('/admin/transfers', { params }),
};

// Bank
export const bankAPI = {
  getDashboard: () => api.get('/bank/dashboard'),
  verifyProperty: (propertyId) => api.get(`/bank/verify-property/${propertyId}`),
  verifyDocument: (hash) => api.get(`/bank/verify-document/${hash}`),
  getOwnerProperties: (walletAddress) => api.get(`/bank/owner-properties/${walletAddress}`),
};

export default api;
