// Talks to the Express REST API. The session cookie is sent automatically (same address).
export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields; // { fieldName: 'error text' } for form validation
  }
}

async function send(method, url, payload, signal) {
  const options = { method, credentials: 'same-origin', signal, headers: {} };
  if (payload !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status})`, response.status, data.errors || {});
  }
  return data;
}

export const http = {
  get: (url, signal) => send('GET', url, undefined, signal),
  post: (url, payload = {}) => send('POST', url, payload),
  remove: (url) => send('DELETE', url),
};

// All API addresses in one place
export const endpoints = {
  me: '/api/me',
  login: '/api/login',
  register: '/api/register',
  logout: '/api/logout',
  categories: '/api/categories',
  listings: (filters) => `/api/ads?${new URLSearchParams(filters)}`,
  listing: (id) => `/api/ads/${id}`,
  comments: (id) => `/api/ads/${id}/comments`,
  saved: '/api/favorites',
  savedItem: (id) => `/api/favorites/${id}`,
};

export const photoUrl = (fileName) => `/uploads/${fileName}`;
