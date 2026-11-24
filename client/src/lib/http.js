// Talks to the Turgus REST API. The session cookie travels automatically (same address).
export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors; // { fieldName: 'what is wrong' } when a form needs fixing
  }
}

async function send(method, url, payload, signal) {
  const options = { method, credentials: 'same-origin', signal, headers: { Accept: 'application/json' } };
  if (payload !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(url, options);
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || `The server answered ${response.status}.`, response.status, data.fieldErrors || {});
  }
  return data;
}

export const http = {
  get: (url, signal) => send('GET', url, undefined, signal),
  post: (url, payload = {}) => send('POST', url, payload),
  put: (url) => send('PUT', url),
  remove: (url) => send('DELETE', url),
};

// Every API address in one place
export const api = {
  session: '/api/session', // GET who am I, POST sign in, DELETE sign out
  members: '/api/members', // POST create an account
  categories: '/api/categories',
  listings: (filters) => `/api/listings?${new URLSearchParams(filters)}`,
  listing: (id) => `/api/listings/${id}`,
  comments: (id) => `/api/listings/${id}/comments`,
  saved: '/api/saved',
  savedListing: (id) => `/api/saved/${id}`, // PUT to star, DELETE to unstar
};
