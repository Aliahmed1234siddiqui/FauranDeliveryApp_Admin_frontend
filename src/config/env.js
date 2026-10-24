// Runtime configuration, read once from Vite env vars (see .env.example).
//
// In development Vite proxies /api and /socket.io to VITE_BACKEND_URL
// (vite.config.js), so the defaults below work without any .env file.

// Accepts "/api", "https://host/api" or a bare "https://host" (then /api is added).
function apiBase(value = '/api') {
  const trimmed = value.replace(/\/+$/, '');
  if (/^https?:\/\/[^/]+$/i.test(trimmed)) return `${trimmed}/api`;
  return trimmed || '/api';
}

export const API_BASE_URL = apiBase(import.meta.env.VITE_API_BASE_URL);

// Socket.IO lives on the server root, not under /api. Defaults to the API's host.
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (/^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : window.location.origin);

// Rows per page on list screens. The backend allows up to 500.
export const PAGE_SIZE = 20;

// Upper bound used when a screen needs "all" rows of a list (dropdowns, counts).
export const MAX_LIMIT = 500;
