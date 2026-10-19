// Dashboard, reports and settings (handbook sections 10 and 15).
//
// Money words: totalSales = what customers paid (products + delivery) · productSales =
// products only · deliveryFees = rider earnings · platformCommission = Furan's profit ·
// vendorPayout = productSales - commission. Reports count delivered orders only and
// filter on the order's created date. Date params: { from, to } as YYYY-MM-DD.
import { http } from '../http';

export const dashboardApi = {
  /**
   * GET /admin/dashboard/summary   🔒 dashboard
   * → { users: { customers, newCustomersThisMonth,
   *              vendors: { total, pending, approved, rejected },
   *              riders: { total, pending, approved, rejected, online } },
   *     orders: { total, today, active, failedDeliveries, delivered, cancelled, byStatus: { [status]: n } },
   *     revenue: { allTime | today | thisMonth: { orders, totalSales, productSales, deliveryFees,
   *                                               platformCommission, vendorPayout } },
   *     inventory: { totalProducts, lowStock, outOfStock, pendingApproval, lowStockThreshold },
   *     topVendors: [vendorRow], topRiders: [riderRow], recentOrders: [order], commissionPercent }
   */
  summary: () => http.get('/admin/dashboard/summary'),

  /** GET /admin/dashboard/commission { from, to }   🔒 dashboard | reports → [vendorRow] */
  commission: (params) => http.get('/admin/dashboard/commission', params),

  /** GET /admin/analytics/sales { groupBy, from, to }   🔒 reports | dashboard → [salesRow] */
  sales: (params) => http.get('/admin/analytics/sales', params),
};

export const reportsApi = {
  /**
   * GET /admin/reports/sales { groupBy: day|week|month|year, from, to }   🔒 reports
   * → [{ period, orderCount, totalSales, productSales, deliveryFees, platformCommission, vendorPayout }]
   *   oldest first; periods without delivered orders are left out.
   */
  sales: (params) => http.get('/admin/reports/sales', params),

  /**
   * GET /admin/reports/revenue { from, to }   🔒 reports
   * → { period, deliveredOrders, totalSales, productSales, deliveryFees, platformCommission,
   *     vendorPayout, avgOrderValue, byPaymentMethod: { cod?, stripe?: { orders, amount } },
   *     refunds: { count, amount }, cancelledOrders: { count, amount },
   *     failedDeliveries: { count, riderFeesPaid, furanCost, cardRefundsDue }, commissionPercent }
   */
  revenue: (params) => http.get('/admin/reports/revenue', params),

  /**
   * GET /admin/reports/vendors { from, to }   🔒 reports
   * vendorRow: { _id, vendorId, vendorName, storeName, ownerName, totalOrders, totalSales,
   *              totalRevenue (= productSales), productSales, totalCommission (= platformCommission),
   *              platformCommission, vendorPayout, avgOrderValue, cancelledOrders }
   */
  vendors: (params) => http.get('/admin/reports/vendors', params),

  /**
   * GET /admin/reports/riders { from, to }   🔒 reports
   * riderRow: { _id, riderId, name, phone, vehicleType, vehicleNumber, isOnline, rating,
   *             totalRatings, deliveries, failedAttempts?, deliveryEarnings, cashCollected,
   *             avgDeliveryMinutes | null }
   */
  riders: (params) => http.get('/admin/reports/riders', params),

  /**
   * GET /admin/reports/forecast { days=30, horizonDays=7, limit=20, vendorId }   🔒 reports | inventory
   * → [{ productId (_id), name, storeName, unitsSold, orders, avgDailyDemand, forecastUnits,
   *      currentStock, daysOfStockLeft | null, suggestedRestock, needsRestock }]
   */
  forecast: (params) => http.get('/admin/reports/forecast', params),
};

export const settingsApi = {
  /**
   * GET /admin/settings   🔒 settings
   * → { radius: { initialKm, stepKm, maxKm, timeoutSec }, commission: { percent },
   *     inventory: { lowStockThreshold }, products: { requireProductApproval },
   *     failedDeliveries: { failedDeliveryWaitMin, maxFailedCodDeliveries },
   *     stripe: { configured, webhookConfigured, currency } }
   */
  get: () => http.get('/admin/settings'),

  /** PUT /admin/settings/radius - any of { initialKm ≥0.5, stepKm ≥0.5, maxKm ≤50, timeoutSec 10-600 }. */
  updateRadius: (payload) => http.put('/admin/settings/radius', numbersOnly(payload)),

  /** PUT /admin/settings/commission { percent: 0-100 } → { percent } */
  updateCommission: (percent) => http.put('/admin/settings/commission', { percent: Number(percent) }),

  /**
   * PUT /admin/settings/general - any of { lowStockThreshold, requireProductApproval,
   * failedDeliveryWaitMin 0-60, maxFailedCodDeliveries 1-10 } → all settings
   */
  updateGeneral: (payload) => http.put('/admin/settings/general', numbersOnly(payload)),
};

// The server reads "" / null number fields as 0, so leave empty ones out and send real numbers.
function numbersOnly(payload) {
  return Object.fromEntries(Object.entries(payload)
    .filter(([, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => [k, typeof v === 'boolean' ? v : Number(v)]));
}
