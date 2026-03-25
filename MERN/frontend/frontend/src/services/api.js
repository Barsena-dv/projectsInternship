import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pnf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unwrap = async (request) => {
  const response = await request;
  return response.data;
};

export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (payload) => unwrap(api.patch('/auth/update-profile', payload)),
  changePassword: (payload) => unwrap(api.patch('/auth/change-password', payload)),
};

export const planApi = {
  getAll: () => unwrap(api.get('/plans')),
};

export const requestApi = {
  create: (payload) => unwrap(api.post('/requests/create', payload)),
  my: () => unwrap(api.get('/requests/my')),
  available: () => unwrap(api.get('/requests/available')),
  byId: (requestId) => unwrap(api.get(`/requests/${requestId}`)),
  update: (requestId, payload) => unwrap(api.patch(`/requests/${requestId}`, payload)),
  remove: (requestId) => unwrap(api.delete(`/requests/${requestId}`)),
};

export const assignmentApi = {
  accept: (requestId, payload = {}) => unwrap(api.post('/assignments/accept', { requestId, ...payload })),
  my: () => unwrap(api.get('/assignments/my')),
  myApplications: () => unwrap(api.get('/assignments/my-applications')),
  byRequest: (requestId) => unwrap(api.get(`/assignments/request/${requestId}`)),
  applicationsByRequest: (requestId) => unwrap(api.get(`/assignments/request/${requestId}/applications`)),
  decideApplication: (requestId, applicationId, payload) => unwrap(api.post(`/assignments/request/${requestId}/applications/${applicationId}/decision`, payload)),
  retryExpired: (requestId) => unwrap(api.post(`/assignments/request/${requestId}/retry`)),
  byId: (assignmentId) => unwrap(api.get(`/assignments/${assignmentId}`)),
  timeline: (assignmentId) => unwrap(api.get(`/assignments/${assignmentId}/timeline`)),
  requestTimeline: (requestId) => unwrap(api.get(`/assignments/request/${requestId}/timeline`)),
  complete: (assignmentId, payload = {}) => unwrap(api.post(`/assignments/${assignmentId}/complete`, payload)),
  pause: (assignmentId) => unwrap(api.post(`/assignments/${assignmentId}/pause`)),
  resume: (assignmentId) => unwrap(api.post(`/assignments/${assignmentId}/resume`)),
};

export const paymentApi = {
  create: (payload) => unwrap(api.post('/payments/create', payload)),
  process: (paymentId, transactionId) => unwrap(api.post(`/payments/${paymentId}/process`, { transactionId })),
  release: (paymentId, reason) => unwrap(api.post(`/payments/${paymentId}/release`, { reason })),
  my: () => unwrap(api.get('/payments/my')),
};

export const evidenceApi = {
  byAssignment: (assignmentId) => unwrap(api.get(`/evidence/${assignmentId}`)),
  upload: (assignmentId, formData) => unwrap(api.post(`/evidence/${assignmentId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })),
  verify: (evidenceId, payload) => unwrap(api.post(`/evidence/${evidenceId}/verify`, payload)),
};

export const trackingApi = {
  create: (payload) => unwrap(api.post('/tracking/update', payload)),
  timeline: (assignmentId) => unwrap(api.get(`/tracking/${assignmentId}`)),
  byAssignment: (assignmentId) => unwrap(api.get(`/tracking/${assignmentId}`)),
};

export const payoutApi = {
  my: () => unwrap(api.get('/payouts/my')),
};

export const notificationApi = {
  my: (params = {}) => unwrap(api.get('/notifications/my', { params })),
  unreadCount: () => unwrap(api.get('/notifications/my/unread-count')),
  markRead: (notificationId) => unwrap(api.patch(`/notifications/${notificationId}/read`)),
  markAllRead: () => unwrap(api.patch('/notifications/my/read-all')),
};

export const ratingApi = {
  create: (payload) => unwrap(api.post('/ratings/create', payload)),
};

export const chatApi = {
  getOrCreateConversation: (assignmentId) => unwrap(api.post('/chat/conversation', { assignmentId })),
  conversations: () => unwrap(api.get('/chat/conversations')),
  send: (conversationId, payload) => unwrap(api.post(`/chat/${conversationId}/send`, payload)),
  messages: (conversationId, params = {}) => unwrap(api.get(`/chat/${conversationId}/messages`, { params })),
};

export default api;