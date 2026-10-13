// Thin fetch client for the Node backend. Sends the access token, retries once
// after refreshing it on a 401, and unwraps the `{ success, data }` envelope.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'furan_admin_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (token) => { try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage blocked */ } },
  clear: () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } },
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') url.searchParams.set(key, value);
  });
  return url.toString();
}

async function refreshToken() {
  const res = await fetch(buildUrl('/auth/refresh-token'), { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new ApiError('Session expired', 401);
  const json = await res.json();
  tokenStore.set(json.data.accessToken);
  return json.data.accessToken;
}

async function request(method, path, { params, body, retry = true } = {}) {
  const isForm = body instanceof FormData;
  const headers = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    credentials: 'include',
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    try {
      await refreshToken();
      return request(method, path, { params, body, retry: false });
    } catch (err) {
      tokenStore.clear();
      window.dispatchEvent(new Event('fauran:logout'));
      throw err;
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(json.message || `Request failed (${res.status})`, res.status, json);
  return json.data ?? json;
}

export const http = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
};
