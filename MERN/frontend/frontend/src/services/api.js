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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's a 401 Unauthorized error
    if (error.response && error.response.status === 401) {
      // Clear local storage session data
      localStorage.removeItem('pnf_token');
      localStorage.removeItem('pnf_user');

      // Redirect to login page only if the user is not already there
      // This prevents infinite redirection loops on the login page itself
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

const unwrap = async (request) => {
  const response = await request;
  return response.data;
};

export const authApi = {
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  login: (payload) => unwrap(api.post('/auth/login', payload)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (payload) => {
    const isFormData = payload instanceof FormData;
    return unwrap(api.patch('/auth/update-profile', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    }));
  },
  changePassword: (payload) => unwrap(api.patch('/auth/change-password', payload)),
  forgotPassword: (email) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (token, password) => unwrap(api.post(`/auth/reset-password/${token}`, { password })),
};

export const auditLogApi = {
  my: (params = {}) => unwrap(api.get('/audit-logs/my', { params })),
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
  retrySameFinder: (requestId, payload = {}) => unwrap(api.post(`/assignments/request/${requestId}/retry-same-finder`, payload)),
  retryDifferentFinder: (requestId, payload = {}) => unwrap(api.post(`/assignments/request/${requestId}/retry-different-finder`, payload)),
  dropByOwner: (requestId, payload = {}) => unwrap(api.post(`/assignments/request/${requestId}/drop-by-owner`, payload)),
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

export const adminApi = {
  dashboard: () => unwrap(api.get('/admin/dashboard')),

  users: (params = {}) => unwrap(api.get('/admin/users', { params })),
  userProfile: (userId) => unwrap(api.get(`/admin/users/${userId}`)),
  verifyFinder: (userId, payload) => unwrap(api.post(`/admin/finder/${userId}/verify`, payload)),
  updateUserStatus: (userId, payload) => unwrap(api.patch(`/admin/user/${userId}/status`, payload)),

  requests: (params = {}) => unwrap(api.get('/admin/requests', { params })),
  requestDetails: (requestId) => unwrap(api.get(`/admin/requests/${requestId}`)),
  deleteRequest: (requestId, payload = {}) => unwrap(api.delete(`/admin/requests/${requestId}`, { data: payload })),
  forceCloseRequest: (requestId, payload = {}) => unwrap(api.post(`/admin/requests/${requestId}/force-close`, payload)),
  reopenRequest: (requestId, payload = {}) => unwrap(api.post(`/admin/requests/${requestId}/reopen`, payload)),

  assignments: (params = {}) => unwrap(api.get('/admin/assignments', { params })),
  assignmentDetails: (assignmentId) => unwrap(api.get(`/admin/assignments/${assignmentId}`)),
  updateAssignmentStatus: (assignmentId, payload) => unwrap(api.post(`/admin/assignments/${assignmentId}/status`, payload)),
  extendAssignmentDeadline: (assignmentId, payload) => unwrap(api.post(`/admin/assignments/${assignmentId}/extend-deadline`, payload)),
  trackingAnalytics: (assignmentId) => unwrap(api.get(`/admin/tracking/assignments/${assignmentId}/analytics`)),

  disputes: (params = {}) => unwrap(api.get('/admin/disputes', { params })),
  disputeDetails: (disputeId) => unwrap(api.get(`/admin/disputes/${disputeId}`)),
  resolveDispute: (disputeId, payload) => unwrap(api.post(`/admin/disputes/${disputeId}/resolve`, payload)),

  payments: (params = {}) => unwrap(api.get('/admin/payments', { params })),
  paymentDetails: (paymentId) => unwrap(api.get(`/admin/payments/${paymentId}`)),
  forceReleasePayment: (paymentId, payload = {}) => unwrap(api.post(`/admin/payments/${paymentId}/force-release`, payload)),
  refundPayment: (paymentId, payload = {}) => unwrap(api.post(`/admin/payments/${paymentId}/refund`, payload)),
  flagPayment: (paymentId, payload = {}) => unwrap(api.post(`/admin/payments/${paymentId}/flag`, payload)),

  auditLogs: (params = {}) => unwrap(api.get('/admin/audit-logs', { params })),
  notifications: (params = {}) => unwrap(api.get('/admin/notifications', { params })),
  fraudSignals: (params = {}) => unwrap(api.get('/admin/fraud-signals', { params })),
  settings: () => unwrap(api.get('/admin/settings')),
  updateSettings: (payload) => unwrap(api.patch('/admin/settings', payload)),
};

export default api;