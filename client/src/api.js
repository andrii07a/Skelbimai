// Small helper for talking to the Express REST API.
// The session cookie is sent automatically because the API is on the same address.
async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.fieldErrors = data.errors || {};
    throw error;
  }
  return data;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  delete: (url) => request('DELETE', url),
};

const priceFormat = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
export const formatPrice = (price) => priceFormat.format(price);

// SQLite stores "2026-11-24 13:39:37" in UTC
export const formatDate = (value) =>
  new Date(value.replace(' ', 'T') + 'Z').toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
