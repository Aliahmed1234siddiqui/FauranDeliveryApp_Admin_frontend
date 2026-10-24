// Vendors, riders, customers and the generic block switch (handbook sections 5-7).
//
// Every `:id` accepts our readable id (VEN…, RID…, CUS…) or the MongoDB _id.
// List calls resolve `{ items, total, page, limit, totalPages }`.
import { http } from '@/services/http';

export const vendorsApi = {
  /**
   * GET /admin/vendors   🔒 vendors | dashboard
   * params: { status: pending|approved|rejected, isActive: true|false, search, page, limit }
   * item:   { _id, vendorId, name (owner), email, phone, isActive, storeName, storeLogo,
   *           storeAddress: { address, lat, lng }, openingTime, closingTime, isOpen,
   *           bankDetails: { accountTitle, accountNumber, bankName }, approvalStatus,
   *           documents: [url], rating, totalRatings, createdAt,
   *           productCount, deliveredOrders, totalSales }
   */
  list: (params) => http.page('/admin/vendors', params),

  /**
   * GET /admin/vendors/:id   🔒 vendors
   * → { vendor, stats: { totalOrders, deliveredOrders, cancelledOrders, totalSales,
   *       platformCommission, vendorPayout, productCount, ordersByStatus: { [status]: n } },
   *     products: [product], recentOrders: [order + customer{ customerId, name, phone }] }
   */
  get: (id) => http.get(`/admin/vendors/${id}`),

  /**
   * PATCH /admin/vendors/:id/approve   🔒 vendors
   * approvalStatus: approved (also unblocks) | rejected (blocks + logs out) | pending
   * reason is only sent in the notification. → the updated vendor
   */
  setApproval: (id, approvalStatus, reason) =>
    http.patch(`/admin/vendors/${id}/approve`, { approvalStatus, reason }),
};

export const ridersApi = {
  /**
   * GET /admin/riders   🔒 riders | dashboard
   * params: { status: pending|approved|rejected, isOnline, isActive, search, page, limit }
   * item:   { _id, riderId, name, email, phone, isActive, cnic, licenseNumber, vehicleType,
   *           vehicleNumber, documents: [url], approvalStatus, isOnline, isAvailable,
   *           currentLocation: { coordinates: [lng, lat] }, rating, totalRatings,
   *           totalDeliveries, payoutDetails: { method, accountTitle, accountNumber },
   *           createdAt, totalEarnings }
   */
  list: (params) => http.page('/admin/riders', params),

  /**
   * GET /admin/riders/live   🔒 riders  (not paged)
   * → [{ _id, riderId, name, phone, vehicleType, vehicleNumber, rating, isAvailable,
   *      location: { lat, lng }, lastSeen,
   *      activeOrder: null | { orderId, status, deliveryAddress: { addressLine }, vendor: { storeName } } }]
   * A rider that never shared GPS comes back at { lat: 0, lng: 0 } - skip those pins.
   */
  live: () => http.get('/admin/riders/live'),

  /**
   * GET /admin/riders/:id   🔒 riders
   * → { rider, stats: { totalAssigned, deliveries, cancelled, failedDeliveries, totalEarnings,
   *       cashCollected, avgDeliveryMinutes, rating, totalRatings },
   *     recentOrders: [order + vendor{ storeName } + customer{ name }] }
   */
  get: (id) => http.get(`/admin/riders/${id}`),

  /** PATCH /admin/riders/:id/approve - same rules as vendorsApi.setApproval. */
  setApproval: (id, approvalStatus, reason) =>
    http.patch(`/admin/riders/${id}/approve`, { approvalStatus, reason }),
};

export const customersApi = {
  /**
   * GET /admin/customers   🔒 customers
   * params: { status: active|inactive, verified: true|false, search, page, limit }
   * item:   { _id, customerId, name, email, phone, isActive, isVerified,
   *           failedCodDeliveries, codBlocked, createdAt, totalOrders, totalSpent, lastOrderAt }
   */
  list: (params) => http.page('/admin/customers', params),

  /**
   * GET /admin/customers/:id   🔒 customers
   * → { customer, stats: { totalOrders, deliveredOrders, cancelledOrders, totalSpent, lastOrderAt },
   *     addresses: [{ addressId, label, addressLine, city, isDefault }],
   *     orders: [order + vendor{ storeName } + rider{ name } | null] }
   */
  get: (id) => http.get(`/admin/customers/${id}`),

  /** PATCH /admin/customers/:id/status { isActive, reason? } - false blocks and logs out. */
  setActive: (id, isActive, reason) => http.patch(`/admin/customers/${id}/status`, { isActive, reason }),

  /** PATCH /admin/customers/:id/cod { codBlocked } - false re-allows COD and resets failedCodDeliveries. */
  setCodBlocked: (id, codBlocked) => http.patch(`/admin/customers/${id}/cod`, { codBlocked }),
};

export const usersApi = {
  /**
   * PATCH /admin/users/:id/block { isActive, reason? }   🔒 permission of the target's role
   * Works for customers, vendors, riders and employees. → the updated user
   * 400 "You cannot block your own account" · 403 "Only a super admin can block another super admin"
   */
  setActive: (id, isActive, reason) => http.patch(`/admin/users/${id}/block`, { isActive, reason }),
};
