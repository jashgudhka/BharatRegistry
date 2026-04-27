import axios from "axios";
import { API_URL } from "./constants";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Request interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bharat_token");
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
      localStorage.removeItem("bharat_token");
      localStorage.removeItem("bharat_user");
    }
    return Promise.reject(error);
  },
);

// Auth
export const authAPI = {
  checkWallet: (walletAddress) => api.get(`/auth/check/${walletAddress}`),
  register: (data) => api.post("/auth/register", data),
  login: (email, password) => api.post("/auth/login", { email, password }),
  getNonce: () => api.get(`/auth/nonce`),
  verify: (walletAddress, signature) =>
    api.post("/auth/verify", { walletAddress, signature }),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  linkWallet: (walletAddress, signature, label) =>
    api.post("/auth/link-wallet", { walletAddress, signature, label }),
};

// Documents
export const documentAPI = {
  upload: (formData) => api.post("/documents/upload", formData),
  getMyDocuments: () => api.get("/documents/my"),
  verifyDocument: (hash) => api.get(`/documents/verify/${hash}`),
  downloadDocument: (hash) =>
    api.get(`/documents/${hash}/download`, { responseType: "blob" }),
  getPropertyDocuments: (propertyId) =>
    api.get(`/documents/property/${propertyId}`),
};

// Properties
export const propertyAPI = {
  getAll: (params) => api.get("/properties", { params }),
  getById: (id) => api.get(`/properties/${id}`),
  getByOwner: (walletAddress) => api.get(`/properties/owner/${walletAddress}`),
  sync: (propertyId, data) => api.post(`/properties/sync/${propertyId}`, data),
  search: (params) => api.get("/properties/search/query", { params }),
  getStats: () => api.get("/properties/stats/overview"),
};

// Transfers
export const transferAPI = {
  getAll: (params) => api.get("/transfers", { params }),
  getById: (id) => api.get(`/transfers/${id}`),
  getByUser: (walletAddress) => api.get(`/transfers/user/${walletAddress}`),
  getByProperty: (propertyId) => api.get(`/transfers/property/${propertyId}`),
  sync: (transferId, data) => api.post(`/transfers/sync/${transferId}`, data),
  getStats: () => api.get("/transfers/stats/overview"),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getUsers: (params) => api.get("/admin/users", { params }),
  getPendingUsers: () => api.get("/admin/users/pending"),
  verifyUser: (walletAddress, approved, reason) =>
    api.put(`/admin/users/${walletAddress}/verify`, { approved, reason }),
  updateUserRole: (walletAddress, role) =>
    api.put(`/admin/users/${walletAddress}/role`, { role }),
  getPendingProperties: () => api.get("/admin/properties/pending"),
  verifyProperty: (propertyId, approved, reason) =>
    api.put(`/admin/properties/${propertyId}/verify`, { approved, reason }),
  getPendingDocuments: () => api.get("/admin/documents/pending"),
  verifyDocument: (hash, approved, reason, notes) =>
    api.put(`/admin/documents/${hash}/verify`, { approved, reason, notes }),
  getTransfers: (params) => api.get("/admin/transfers", { params }),
};

// Bank
export const bankAPI = {
  getDashboard: () => api.get("/bank/dashboard"),
  verifyProperty: (propertyId) =>
    api.get(`/bank/verify-property/${propertyId}`),
  verifyDocument: (hash) => api.get(`/bank/verify-document/${hash}`),
  getOwnerProperties: (walletAddress) =>
    api.get(`/bank/owner-properties/${walletAddress}`),
};

// Ecosystem modules
export const ecosystemAPI = {
  getDocumentAuthenticity: (hash) =>
    api.get(`/ecosystem/documents/authentic/${hash}`),
  registerDocumentHash: (payload) =>
    api.post("/ecosystem/documents/register", payload),
  verifyDocumentHash: (hash) => api.post(`/ecosystem/documents/${hash}/verify`),

  submitIdentity: (payload) => api.post("/ecosystem/identity/submit", payload),
  reviewIdentity: (payload) => api.post("/ecosystem/identity/review", payload),
  grantIdentityRole: (payload) =>
    api.post("/ecosystem/identity/roles/grant", payload),
  getIdentity: (walletAddress) =>
    api.get(`/ecosystem/identity/${walletAddress}`),

  createLien: (payload) => api.post("/ecosystem/mortgages/create", payload),
  updateLienOutstanding: (lienId, payload) =>
    api.post(`/ecosystem/mortgages/${lienId}/outstanding`, payload),
  closeLien: (lienId, payload) =>
    api.post(`/ecosystem/mortgages/${lienId}/close`, payload),
  getLien: (lienId) => api.get(`/ecosystem/mortgages/${lienId}`),
  getPropertyEncumbrance: (propertyId) =>
    api.get(`/ecosystem/mortgages/property/${propertyId}/encumbrance`),

  openDispute: (payload) => api.post("/ecosystem/disputes/open", payload),
  moveDisputeToReview: (disputeId) =>
    api.post(`/ecosystem/disputes/${disputeId}/review`),
  resolveDispute: (disputeId, payload) =>
    api.post(`/ecosystem/disputes/${disputeId}/resolve`, payload),
  rejectDispute: (disputeId, payload) =>
    api.post(`/ecosystem/disputes/${disputeId}/reject`, payload),
  appealDispute: (disputeId, payload) =>
    api.post(`/ecosystem/disputes/${disputeId}/appeal`, payload),
  getDispute: (disputeId) => api.get(`/ecosystem/disputes/${disputeId}`),

  fundInsuranceReserve: (payload) =>
    api.post("/ecosystem/insurance/reserve/fund", payload),
  issuePolicy: (payload) =>
    api.post("/ecosystem/insurance/policies/issue", payload),
  payoutPolicyClaim: (policyId, payload) =>
    api.post(`/ecosystem/insurance/policies/${policyId}/payout`, payload),
  getPolicy: (policyId) => api.get(`/ecosystem/insurance/policies/${policyId}`),

  tokenizeProperty: (payload) => api.post("/ecosystem/tokenize", payload),
  getTokenizedProperty: (propertyId) =>
    api.get(`/ecosystem/token/property/${propertyId}`),
  getHolderShares: (propertyId, walletAddress) =>
    api.get(`/ecosystem/token/property/${propertyId}/holder/${walletAddress}`),
};

export default api;
