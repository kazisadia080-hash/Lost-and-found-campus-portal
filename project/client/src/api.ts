const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('token') || '';
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  BASE,
  // auth
  register: (body) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/api/auth/me'),
  updateProfile: (body) => request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  requestDeleteOtp: () => request('/api/auth/delete-otp', { method: 'POST' }),
  deleteAccount: (otp) => request('/api/auth/me', { method: 'DELETE', body: JSON.stringify({ otp }) }),
  forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),

  // items
  listItems: (query) => request(`/api/items${query ? `?${query}` : ''}`),
  getItem: (id) => request(`/api/items/${id}`),
  createItem: (body) => request('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id, body) => request(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),
  myItems: () => request('/api/items/my/me'),
  myClaims: () => request('/api/items/my-claims/me'),
  myClaim: (itemId) => request(`/api/items/${itemId}/my-claim`),

  // claims
  createClaim: (itemId, body) =>
    request(`/api/items/${itemId}/claims`, { method: 'POST', body: JSON.stringify(body) }),
  itemClaims: (itemId) => request(`/api/items/${itemId}/claims`),
  reviewClaim: (claimId, body) =>
    request(`/api/claims/${claimId}`, { method: 'PATCH', body: JSON.stringify(body) }),

  // users
  getUserProfile: (userId) => request(`/api/users/${userId}`),

  // comments
  itemComments: (itemId) => request(`/api/items/${itemId}/comments`),
  addComment: (itemId, body) =>
    request(`/api/items/${itemId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
  deleteComment: (itemId, commentId) =>
    request(`/api/items/${itemId}/comments/${commentId}`, { method: 'DELETE' }),

  // messages
  conversations: () => request('/api/messages/conversations'),
  getMessages: (userId) => request(`/api/messages/${userId}`),
  sendMessage: (userId, body) =>
    request(`/api/messages/${userId}`, { method: 'POST', body: JSON.stringify(body) }),

  // admin
  adminItems: () => request('/api/admin/items'),
  adminStats: () => request('/api/admin/stats'),
  adminUsers: () => request('/api/admin/users'),
  adminDeleteItem: (id) => request(`/api/admin/items/${id}`, { method: 'DELETE' }),
};
