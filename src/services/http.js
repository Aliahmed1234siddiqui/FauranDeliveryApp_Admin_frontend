// Fetch client for the Furan backend.
//
// - Sends `Authorization: Bearer <accessToken>` on every request.
// - Unwraps the `{ success, message, data }` envelope and throws ApiError on failure.
// - On 401 it tries one token refresh, then logs the admin out.
// - On "account blocked" 403 it logs out straight away.
// - `http.page()` reads the X-Total-* paging headers into `{ items, total, ... }`.

import { API_BASE_URL } from '@/config/env';

// ---------------------------------------------------------------------------
// Token storage. "Remember me" keeps the token in localStorage (7 days);
// otherwise sessionStorage, so it is gone when the tab closes.
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'furan_admin_token';
const REFRESH_KEY = 'furan_admin_refresh';

const safe = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};

export const tokenStore = {
  get: () => safe(() => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)),
  getRefresh: () => safe(() => localStorage.getItem(REFRESH_KEY) || sessionStorage.getItem(REFRESH_KEY)),
  set: (accessToken, refreshToken, remember = true) =>
    safe(() => {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) store.setItem(REFRESH_KEY, refreshToken);
    }),
  // Keeps the token in whichever storage it already lives in.
  update: (accessToken, refreshToken) =>
    safe(() => {
      const store = sessionStorage.getItem(TOKEN_KEY) ? sessionStorage : localStorage;
      store.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) store.setItem(REFRESH_KEY, refreshToken);
    }),
  clear: () =>
    safe(() => {
      [localStorage, sessionStorage].forEach((s) => {
        s.removeItem(TOKEN_KEY);
        s.removeItem(REFRESH_KEY);
      });
    }),
};

// Fired when the session can't be recovered; AuthProvider listens and resets.
export const LOGOUT_EVENT = 'furan:logout';
const forceLogout = (reason) => {
  tokenStore.clear();
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT, { detail: reason }));
};

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body; // full JSON body, e.g. bulk-create's { data: { created, failed } }
  }
}

// ---------------------------------------------------------------------------
// URL + body helpers
// ---------------------------------------------------------------------------

// Skips empty filters, so pages can pass `status: 'all'` or `search: ''` freely.
const isEmptyParam = (v) => v === undefined || v === null || v === '' || v === 'all';

function buildUrl(path, params) {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (!isEmptyParam(value)) url.searchParams.set(key, value);
  });
  return url.toString();
}

/**
 * Body for routes that accept pictures (products, categories, master catalog).
 * Sends multipart only when real File objects are attached; otherwise plain JSON,
 * which keeps booleans, numbers and arrays typed.
 *
 * Multipart rules (see handbook section 11): `undefined` is skipped, `null`
 * becomes "" (the server ignores empty strings), arrays repeat the key.
 */
export function withFiles(payload, fileKey) {
  const attached = payload[fileKey];
  const files = [].concat(attached ?? []).filter((f) => f instanceof File);

  if (!files.length) {
    // No uploads: send JSON. Arrays of URLs (master-catalog images) pass through;
    // an empty file list is dropped so it doesn't wipe the saved images.
    const json = { ...payload };
    if (Array.isArray(attached) && attached.length === 0) delete json[fileKey];
    return json;
  }
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || key === fileKey) return;
    if (Array.isArray(value)) value.forEach((v) => form.append(key, v));
    else form.append(key, value === null ? '' : String(value));
  });
  files.forEach((file) => form.append(fileKey, file));
  return form;
}

// ---------------------------------------------------------------------------
// Core request
// ---------------------------------------------------------------------------
let refreshing = null; // one refresh shared by every request that hit 401 at once

async function refreshAccessToken() {
  refreshing ??= (async () => {
    const refreshToken = tokenStore.getRefresh();
    const res = await fetch(buildUrl('/auth/refresh-token'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.data?.accessToken)
      throw new ApiError('Your session has expired. Please log in again.', 401);
    tokenStore.update(json.data.accessToken, json.data.refreshToken);
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

// 401s that a refresh cannot fix.
const DEAD_SESSION = /no longer exists|no token provided/i;
const BLOCKED = /blocked by admin/i;

async function request(method, path, { params, body, raw = false, retry = true } = {}) {
  const isForm = body instanceof FormData;
  const headers = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and that the API is running.', 0);
  }

  const json = await res.json().catch(() => ({}));
  const message = json.message || `Request failed (${res.status})`;
  const isAuthRoute = path.startsWith('/auth/');

  if (res.status === 401 && !isAuthRoute) {
    if (retry && token && !DEAD_SESSION.test(message)) {
      try {
        await refreshAccessToken();
        return request(method, path, { params, body, raw, retry: false });
      } catch {
        /* fall through to logout */
      }
    }
    forceLogout(message);
    throw new ApiError(message, 401, json);
  }
  if (res.status === 403 && BLOCKED.test(message)) {
    forceLogout(message);
    throw new ApiError(message, 403, json);
  }
  // `success: false` with a 2xx never happens today, but treat it as an error if it does.
  if (!res.ok || json.success === false) throw new ApiError(message, res.status, json);

  return raw ? { data: json.data, message: json.message, headers: res.headers } : json.data;
}

// Reads the paging headers the admin list routes send.
function toPage(data, headers, params = {}) {
  const items = Array.isArray(data) ? data : [];
  const header = (name) => Number(headers.get(name));
  const limit = header('X-Limit') || Number(params.limit) || items.length || 1;
  const total = headers.get('X-Total-Count') !== null ? header('X-Total-Count') : items.length;
  return {
    items,
    total,
    page: header('X-Page') || Number(params.page) || 1,
    limit,
    totalPages: header('X-Total-Pages') || Math.max(1, Math.ceil(total / limit)),
  };
}

export const http = {
  get: (path, params) => request('GET', path, { params }),
  post: (path, body) => request('POST', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),

  /** Paged list → `{ items, total, page, limit, totalPages }`. */
  page: async (path, params) => {
    const { data, headers } = await request('GET', path, { params, raw: true });
    return toPage(data, headers, params);
  },

  /** Same as the verbs above but resolves `{ data, message, headers }` (for server messages like refund hints). */
  raw: (method, path, { params, body } = {}) => request(method, path, { params, body, raw: true }),
};
