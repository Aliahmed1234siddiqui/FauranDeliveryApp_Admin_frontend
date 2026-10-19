// Employees (sub-admins) and the admin's own notifications (handbook sections 17-18).
import { http } from '../http';

export const employeesApi = {
  /**
   * GET /admin/employees   🔒 employees  (super admins are not listed)
   * params: { search, status: active|inactive, permission, page, limit }
   * item:   { _id, employeeId, name, email, phone, role, isSuperAdmin, permissions[],
   *           designation, isActive, isVerified, createdBy: { adminId | employeeId, name }, createdAt }
   */
  list: (params) => http.page('/admin/employees', params),

  /** GET /admin/employees/:id (EMP…, ADM… or _id) → employee */
  get: (id) => http.get(`/admin/employees/${id}`),

  /**
   * POST /admin/employees { name*, email*, phone*, password* (≥8), permissions*: [key], designation }
   * You can only grant permissions you have yourself.
   */
  create: (payload) => http.post('/admin/employees', payload),

  /**
   * PUT /admin/employees/:id - any of { name, email, phone, permissions, designation,
   * isActive, password }. Deactivating or a new password logs them out.
   */
  update: (id, payload) => http.put(`/admin/employees/${id}`, payload),

  /** DELETE /admin/employees/:id - for good. To keep the account, update({ isActive: false }). */
  remove: (id) => http.delete(`/admin/employees/${id}`),
};

export const notificationsApi = {
  /**
   * GET /api/notifications { page, limit, unreadOnly, type }
   * → { notifications: [{ _id, title, message, type, isRead, data?, createdAt }], unreadCount, pagination }
   */
  list: (params) => http.get('/notifications', params),
  unreadCount: () => http.get('/notifications/unread-count'),
  markRead: (id) => http.patch(`/notifications/${id}/read`, {}),
  markAllRead: () => http.patch('/notifications/read-all', {}),
  remove: (id) => http.delete(`/notifications/${id}`),
  clearAll: () => http.delete('/notifications'),
};
