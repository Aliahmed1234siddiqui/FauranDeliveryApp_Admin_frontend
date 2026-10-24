// Auth + the logged-in admin's account (handbook sections 1 and 4).
import { http } from '@/services/http';

export const authApi = {
  /**
   * POST /api/auth/login  { identifier: email or phone, password }
   * → { user, accessToken, refreshToken? }
   * user: { _id, adminId | employeeId, name, email, phone, role: 'admin', isSuperAdmin, permissions[] }
   * 400 missing fields · 401 wrong password · 403 blocked / unverified · 429 too many attempts
   */
  login: (identifier, password) => http.post('/auth/login', { identifier, password }),

  logout: () => http.post('/auth/logout', {}),
};

export const accountApi = {
  /**
   * GET /admin/me → the admin record. Call after login and on reload to build the menu.
   * { _id, adminId | employeeId, name, email, phone, profileImage, isActive, isSuperAdmin,
   *   permissions[], designation, createdBy, createdAt }
   */
  me: () => http.get('/admin/me'),

  /** GET /admin/permissions → [{ key, description }] (12 items, for employee-form checkboxes). */
  permissions: () => http.get('/admin/permissions'),
};
