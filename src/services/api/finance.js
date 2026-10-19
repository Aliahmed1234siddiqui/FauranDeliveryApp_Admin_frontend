// Payouts, rider cash deposits and settlements (handbook section 16).
//
// Balances are computed by the server on every call:
//   vendor: due = totalEarned - paidOut
//   rider:  cashInHand = cashCollected - cashDeposited
//           balance = totalEarned - paidOut - cashInHand
//           furanOwesRider = max(balance, 0) · riderOwesFuran = max(-balance, 0)
// A rider can only be paid up to furanOwesRider, so record their cash deposit first.
import { http } from '../http';

export const SETTLEMENT_METHODS = ['bank_transfer', 'cash', 'easypaisa', 'jazzcash', 'other'];

export const payoutsApi = {
  /**
   * GET /admin/payouts/vendors { due: true? }   🔒 payments  (not paged, most owed first)
   * → [{ _id, vendorId, name, storeName, phone, bankDetails?, deliveredOrders, productSales,
   *      totalEarned, paidOut, due, lastPayoutAt }]
   */
  vendorBalances: (params) => http.get('/admin/payouts/vendors', params),

  /**
   * GET /admin/payouts/riders { owes: furan|rider }   🔒 payments  (not paged)
   * → [{ _id, riderId, name, phone, vehicleNumber, payoutDetails, deliveries, failedAttempts,
   *      totalEarned, paidOut, cashCollected, cashDeposited, cashInHand,
   *      balance, furanOwesRider, riderOwesFuran, lastPayoutAt }]
   */
  riderBalances: (params) => http.get('/admin/payouts/riders', params),

  /**
   * GET /admin/payouts/user/:id   🔒 payments  (VEN…, RID… or _id)
   * → { user, balance (vendor or rider fields as above), settlements: [settlement] }
   */
  ledger: (id) => http.get(`/admin/payouts/user/${id}`),

  /**
   * POST /admin/payouts { userId*, amount*, method = bank_transfer, reference, note }
   * → { settlement, balance }. 400 "Only PKR … is owed to this vendor|rider"
   */
  create: ({ userId, amount, method, reference, note }) => http.post('/admin/payouts', { userId, amount: Number(amount), method, reference, note }),

  /**
   * POST /admin/payouts/cash-deposit { riderId*, amount*, method = cash, reference, note }
   * → { settlement, balance }. 400 "The rider only holds PKR …"
   */
  recordCashDeposit: ({ riderId, amount, method, reference, note }) => http.post('/admin/payouts/cash-deposit', { riderId, amount: Number(amount), method, reference, note }),
};

export const settlementsApi = {
  /**
   * GET /admin/settlements   🔒 payments
   * params: { role: vendor|rider, type: payout|cash_deposit, userId, from, to, page, limit }
   * item:   { _id, settlementId, user: { riderId | vendorId, name, phone, role, storeName? },
   *           role, type, amount, method, reference, note,
   *           createdBy: { adminId | employeeId, name }, createdAt }
   */
  list: (params) => http.page('/admin/settlements', params),
};
