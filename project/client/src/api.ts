const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : import.meta.env.DEV
  ? 'http://localhost:5000'
  : '';

function getToken() {
  return localStorage.getItem('token') || '';
}

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

interface ApiError extends Error {
  status?: number;
}

async function request(path: string, options: ApiOptions = {}) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: ApiError = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  BASE,
  // auth
  register: (body: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  verifyUniversity: (body: any) => request('/api/auth/verify-university', { method: 'POST', body: JSON.stringify(body) }),
  requestUniversityVerify: (body: any) => request('/api/auth/request-university-verify', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  updateProfile: (body: any) => request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  requestDeleteOtp: () => request('/api/auth/delete-otp', { method: 'POST' }),
  deleteAccount: (otp: string) => request('/api/auth/me', { method: 'DELETE', body: JSON.stringify({ otp }) }),
  forgotPassword: (email: string) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // items
  listItems: (query?: string) => request(`/api/items${query ? `?${query}` : ''}`),
  getItem: (id: string) => request(`/api/items/${id}`),
  createItem: (body: any) => request('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id: string, body: any) => request(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteItem: (id: string) => request(`/api/items/${id}`, { method: 'DELETE' }),
  myItems: () => request('/api/items/my/me'),
  myClaims: () => request('/api/items/my-claims/me'),
  myClaim: (itemId: string) => request(`/api/items/${itemId}/my-claim`),

  // claims
  createClaim: (itemId: string, body: any) =>
    request(`/api/items/${itemId}/claims`, { method: 'POST', body: JSON.stringify(body) }),
  itemClaims: (itemId: string) => request(`/api/items/${itemId}/claims`),
  reviewClaim: (claimId: string, body: any) =>
    request(`/api/claims/${claimId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // users
  getUserProfile: (userId: string) => request(`/api/users/${userId}`),

  // comments
  itemComments: (itemId: string) => request(`/api/items/${itemId}/comments`),
  addComment: (itemId: string, body: any) =>
    request(`/api/items/${itemId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  deleteComment: (itemId: string, commentId: string) =>
    request(`/api/items/${itemId}/comments/${commentId}`, { method: 'DELETE' }),

  // messages
  conversations: () => request('/api/messages/conversations'),
  getMessages: (userId: string) => request(`/api/messages/${userId}`),
  sendMessage: (userId: string, body: any) =>
    request(`/api/messages/${userId}`, { method: 'POST', body: JSON.stringify(body) }),

  // notifications
  notifications: () => request('/api/notifications'),
  notificationsUnreadCount: () => request('/api/notifications/unread-count'),
  markNotificationRead: (id: string) => request(`/api/notifications/${id}/mark-read`, { method: 'POST' }),

  // admin
  adminItems: () => request('/api/admin/items'),
  adminStats: () => request('/api/admin/stats'),
  adminUsers: () => request('/api/admin/users'),
  adminUpdateUserStatus: (id: string, status: string) =>
    request(`/api/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  adminDeleteUser: (id: string) => request(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adminDeleteItem: (id: string) => request(`/api/admin/items/${id}`, { method: 'DELETE' }),
};