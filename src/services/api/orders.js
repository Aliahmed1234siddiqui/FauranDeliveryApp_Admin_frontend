// Orders, payments and refunds (handbook sections 8-9).
import { http } from '../http';

export const ordersApi = {
  /**
   * GET /admin/orders   🔒 orders | dashboard
   * params: { search (ORD…/TRK…), status, vendorId, riderId, customerId,
   *           paymentMethod: stripe|cod, paymentStatus: pending|paid|failed|refunded,
   *           from, to (YYYY-MM-DD, `to` inclusive), page, limit }
   * item:   { _id, orderId, trackingId,
   *           customer: { customerId, name, phone }, vendor: { vendorId, name, storeName },
   *           rider: null | { riderId, name, phone },
   *           items: [{ product, name, quantity, price }],
   *           deliveryAddress: { addressLine, location },
   *           subtotal, deliveryFee, platformCommission, vendorPayout, totalAmount,
   *           paymentMethod, paymentStatus, status, prepStatus,
   *           failedAt, failureReason, failureNote, returnedAt, returnCondition, refundDue,
   *           cancelledBy, cancelReason, deliveredAt, eta,
   *           statusHistory: [{ status, timestamp }], createdAt }
   */
  list: (params) => http.page('/admin/orders', params),

  /**
   * GET /admin/orders/:id   🔒 orders   (:id = ORD…, TRK… or _id)
   * → { order (with customer.email, vendor.phone/storeAddress, rider.vehicleNumber + currentLocation,
   *            items[].product: { productId, name, images }),
   *     payments: [payment], deliveryMinutes: number | null }
   */
  get: (id) => http.get(`/admin/orders/${id}`),

  /**
   * PATCH /admin/orders/:id/cancel { reason? }   🔒 orders
   * Only before pickup (placed … rider_assigned).
   * → { order, message }. A paid card order is NOT refunded automatically; the message
   *   then contains a refund hint and the UI should offer "Refund now".
   */
  cancel: async (id, reason) => {
    const { data, message } = await http.raw('PATCH', `/admin/orders/${id}/cancel`, { body: { reason } });
    return { order: data, message };
  },

  /**
   * PATCH /admin/orders/:id/confirm-return { restock = true, note? }   🔒 orders
   * delivery_failed → returned. A paid card order then has refundDue > 0. → updated order
   */
  confirmReturn: (id, { restock = true, note } = {}) => http.patch(`/admin/orders/${id}/confirm-return`, { restock, note }),
};

/** True when a cancelled/returned order still needs a manual card refund. */
export const needsRefund = (order) => order?.paymentMethod === 'stripe' && order?.paymentStatus === 'paid'
  && (order.status === 'cancelled' || order.refundDue > 0);

export const paymentsApi = {
  /**
   * GET /admin/payments   🔒 payments
   * params: { method: stripe|cod, status: pending|succeeded|failed|refunded, from, to, page, limit }
   * item:   { _id, paymentId, amount, currency, method, stripePaymentIntentId, status,
   *           commissionAmount, vendorAmount, refundedAmount, createdAt,
   *           order: { orderId, totalAmount, status, paymentMethod,
   *                    customer: { customerId, name, phone }, vendor: { vendorId, storeName } } }
   * Note: the X-Total-Amount header is not CORS-exposed yet, so sum `succeeded` rows client-side.
   */
  list: (params) => http.page('/admin/payments', params),

  /**
   * POST /api/payments/refund/:orderId { amount? }   🔒 payments  (note: not under /admin)
   * Without amount the server refunds refundDue, else the whole payment. One refund per payment.
   * → the refunded payment
   */
  refund: (orderId, amount) => http.post(`/payments/refund/${orderId}`, amount ? { amount: Number(amount) } : {}),
};
