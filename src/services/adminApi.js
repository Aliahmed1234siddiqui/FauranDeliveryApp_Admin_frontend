// One function per route in routes/adminRoutes.js (mounted at /api/admin).
// While USE_MOCK is on, each call resolves against the in-memory mock DB with a
// short delay so loading states are visible. Set VITE_USE_MOCK=false to go live.

import { http } from './http';
import * as db from '../data/mockDb';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const wait = (ms = 380 + Math.random() * 320) => new Promise((r) => setTimeout(r, ms));
const clone = (v) => JSON.parse(JSON.stringify(v));
const mock = async (fn) => { await wait(); return clone(fn()); };
const fail = (message, status = 400) => { const e = new Error(message); e.status = status; throw e; };

const nextCode = (prefix, list, key, len = 4) => `${prefix}${String(list.length + 1).padStart(len, '0')}`;
const findBy = (list, id, codeKey) => list.find((x) => x._id === id || x[codeKey] === id) || fail('Not found', 404);

// Generic list query: search, equality filters, sort, pagination. Mirrors the
// `{ items, total, page, limit }` shape the backend paginates with.
function query(list, params = {}, { searchFields = [], filters = {} } = {}) {
  const { search = '', page = 1, limit = 10, sort } = params;
  let rows = list.filter((row) => {
    if (search) {
      const hay = searchFields.map((f) => f.split('.').reduce((o, k) => o?.[k], row)).join(' ').toLowerCase();
      if (!hay.includes(String(search).toLowerCase())) return false;
    }
    return Object.entries(filters).every(([param, test]) => {
      const value = params[param];
      if (value === undefined || value === '' || value === 'all') return true;
      return test(row, value);
    });
  });
  if (sort) {
    const desc = sort.startsWith('-');
    const key = desc ? sort.slice(1) : sort;
    rows = [...rows].sort((a, b) => {
      const av = key.split('.').reduce((o, k) => o?.[k], a);
      const bv = key.split('.').reduce((o, k) => o?.[k], b);
      return (av > bv ? 1 : av < bv ? -1 : 0) * (desc ? -1 : 1);
    });
  }
  const total = rows.length;
  const start = (Number(page) - 1) * Number(limit);
  return { items: rows.slice(start, start + Number(limit)), total, page: Number(page), limit: Number(limit) };
}

// Mock-only: turn picked File objects into preview URLs so uploads show up immediately.
function withUploads(p) {
  const out = { ...p };
  if (out.image instanceof File) out.image = URL.createObjectURL(out.image);
  else if (out.image === undefined) delete out.image;
  if (Array.isArray(out.images)) out.images = out.images.map((f) => (f instanceof File ? URL.createObjectURL(f) : f));
  return out;
}

// Passwords go to the backend for hashing; the mock never stores them.
const withoutPassword = (p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'password'));

const sumBy = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
const isToday = (iso) => iso.slice(0, 10) === '2026-10-13';
const counts = (list, key) => list.reduce((acc, x) => ({ ...acc, [x[key]]: (acc[x[key]] || 0) + 1 }), {});

function salesSeries(days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date('2026-10-13T00:00:00');
    d.setDate(d.getDate() - (days - 1 - i));
    const wave = Math.sin(i / 3.2) * 90 + i * 9;
    const weekend = [5, 6].includes(d.getDay()) ? 160 : 0;
    const orders = Math.round(980 + wave + weekend + ((i * 37) % 70));
    const gmv = orders * (2180 + ((i * 53) % 260));
    return { date: d.toISOString().slice(0, 10), orders, gmv, commission: Math.round(gmv * 0.071), deliveryFees: Math.round(orders * 62), refunds: Math.round(gmv * 0.012) };
  });
}

// ---------------------------------------------------------------------------
export const adminApi = {
  // ---------- me & permissions ----------
  getMe: () => (USE_MOCK ? mock(() => db.me) : http.get('/admin/me')),
  getPermissionList: () => (USE_MOCK ? mock(() => db.PERMISSIONS) : http.get('/admin/permissions')),

  // ---------- dashboard ----------
  getDashboardSummary: () => USE_MOCK ? mock(() => {
    const today = db.orders.filter((o) => isToday(o.createdAt));
    const series = salesSeries(14);
    return {
      ordersToday: 1284,
      ordersTrend: 12.8,
      gmvToday: 2840000,
      gmvTrend: 8.4,
      commissionToday: 201600,
      commissionTrend: 5.1,
      avgOrderValue: 2212,
      aovTrend: -1.6,
      activeVendors: db.vendors.filter((v) => v.approvalStatus === 'approved' && v.isActive).length,
      onlineRiders: db.riders.filter((r) => r.isOnline).length,
      totalRiders: db.riders.filter((r) => r.approvalStatus === 'approved').length,
      totalCustomers: 18420,
      newCustomersToday: 146,
      pendingApprovals: {
        vendors: db.vendors.filter((v) => v.approvalStatus === 'pending').length,
        riders: db.riders.filter((r) => r.approvalStatus === 'pending').length,
        products: db.products.filter((p) => p.approvalStatus === 'pending').length,
      },
      liveOrders: today.filter((o) => !['delivered', 'cancelled', 'returned'].includes(o.status)).length + 37,
      returnsOpen: db.orders.filter((o) => o.status === 'return_requested').length,
      codHeldByRiders: sumBy(db.riders, (r) => r.codInHand),
      statusBreakdown: counts(db.orders, 'status'),
      sparkOrders: series.map((d) => d.orders),
      sparkGmv: series.map((d) => d.gmv),
      recentOrders: db.orders.slice(0, 6),
    };
  }) : http.get('/admin/dashboard/summary'),
  getCommissionByVendor: () => USE_MOCK ? mock(() => db.vendorBalances.map((b) => ({ vendor: b.user, grossSales: b.grossSales, commission: b.commission })).sort((a, b) => b.grossSales - a.grossSales)) : http.get('/admin/dashboard/commission'),
  getLowStock: () => USE_MOCK ? mock(() => db.products.filter((p) => p.stock <= p.reorderLevel).sort((a, b) => a.stock - b.stock).slice(0, 8)) : http.get('/admin/dashboard/inventory'),

  // ---------- vendors ----------
  getVendors: (params) => USE_MOCK ? mock(() => query(db.vendors, params, {
    searchFields: ['storeName', 'ownerName', 'vendorId', 'area', 'phone'],
    filters: { status: (v, s) => v.approvalStatus === s, storeType: (v, t) => v.storeType === t },
  })) : http.get('/admin/vendors', params),
  getVendorById: (id) => USE_MOCK ? mock(() => {
    const vendor = findBy(db.vendors, id, 'vendorId');
    return { ...vendor, recentOrders: db.orders.filter((o) => o.vendor._id === vendor._id).slice(0, 6), balance: db.vendorBalances.find((b) => b.user._id === vendor._id) || null };
  }) : http.get(`/admin/vendors/${id}`),
  approveVendor: (id, approvalStatus, reason) => USE_MOCK ? mock(() => {
    const v = findBy(db.vendors, id, 'vendorId');
    Object.assign(v, { approvalStatus, rejectionReason: reason || null });
    v.documents.forEach((d) => { d.verified = approvalStatus === 'approved'; });
    return v;
  }) : http.patch(`/admin/vendors/${id}/approve`, { approvalStatus, reason }),

  // ---------- riders ----------
  getRiders: (params) => USE_MOCK ? mock(() => query(db.riders, params, {
    searchFields: ['name', 'phone', 'riderId', 'zone', 'vehicleNumber'],
    filters: { status: (r, s) => r.approvalStatus === s, online: (r, o) => String(r.isOnline) === String(o) },
  })) : http.get('/admin/riders', params),
  getLiveRiders: () => USE_MOCK ? mock(() => db.riders.filter((r) => r.approvalStatus === 'approved' && r.isActive).map((r) => {
    r.location.x = Math.min(94, Math.max(6, r.location.x + (Math.random() - 0.5) * 4));
    r.location.y = Math.min(92, Math.max(8, r.location.y + (Math.random() - 0.5) * 4));
    return r;
  })) : http.get('/admin/riders/live'),
  getRiderById: (id) => USE_MOCK ? mock(() => {
    const rider = findBy(db.riders, id, 'riderId');
    return { ...rider, recentOrders: db.orders.filter((o) => o.rider?._id === rider._id).slice(0, 6), balance: db.riderBalances.find((b) => b.user._id === rider._id) || null };
  }) : http.get(`/admin/riders/${id}`),
  approveRider: (id, approvalStatus, reason) => USE_MOCK ? mock(() => Object.assign(findBy(db.riders, id, 'riderId'), { approvalStatus, rejectionReason: reason || null })) : http.patch(`/admin/riders/${id}/approve`, { approvalStatus, reason }),

  // ---------- customers ----------
  getCustomers: (params) => USE_MOCK ? mock(() => query(db.customers, params, {
    searchFields: ['name', 'phone', 'email', 'customerId'],
    filters: { status: (c, s) => (s === 'active' ? c.isActive : !c.isActive), cod: (c, v) => String(c.codEnabled) === String(v) },
  })) : http.get('/admin/customers', params),
  getCustomerById: (id) => USE_MOCK ? mock(() => {
    const customer = findBy(db.customers, id, 'customerId');
    return { ...customer, recentOrders: db.orders.filter((o) => o.customer._id === customer._id).slice(0, 8) };
  }) : http.get(`/admin/customers/${id}`),
  setCustomerStatus: (id, isActive) => USE_MOCK ? mock(() => Object.assign(findBy(db.customers, id, 'customerId'), { isActive })) : http.patch(`/admin/customers/${id}/status`, { isActive }),
  setCustomerCod: (id, codEnabled) => USE_MOCK ? mock(() => Object.assign(findBy(db.customers, id, 'customerId'), { codEnabled })) : http.patch(`/admin/customers/${id}/cod`, { codEnabled }),

  // Block / unblock any user (customer, vendor or rider)
  blockUser: (id, isActive) => USE_MOCK ? mock(() => {
    const target = [...db.customers, ...db.vendors, ...db.riders].find((u) => u._id === id) || fail('User not found', 404);
    target.isActive = isActive;
    return target;
  }) : http.patch(`/admin/users/${id}/block`, { isActive }),

  // ---------- orders & payments ----------
  getOrders: (params) => USE_MOCK ? mock(() => query(db.orders, params, {
    searchFields: ['orderId', 'customer.name', 'customer.phone', 'vendor.storeName', 'rider.name'],
    filters: {
      status: (o, s) => o.status === s,
      vendorId: (o, v) => o.vendor._id === v,
      paymentMethod: (o, m) => o.paymentMethod === m,
      fromDate: (o, d) => o.createdAt.slice(0, 10) >= d,
      toDate: (o, d) => o.createdAt.slice(0, 10) <= d,
    },
  })) : http.get('/admin/orders', params),
  getOrderById: (id) => USE_MOCK ? mock(() => findBy(db.orders, id, 'orderId')) : http.get(`/admin/orders/${id}`),
  cancelOrder: (id, reason) => USE_MOCK ? mock(() => {
    const o = findBy(db.orders, id, 'orderId');
    if (['delivered', 'cancelled', 'returned'].includes(o.status)) fail('This order can no longer be cancelled');
    o.status = 'cancelled';
    o.paymentStatus = o.paymentMethod === 'cod' ? 'void' : 'refunded';
    o.timeline.push({ status: 'cancelled', at: new Date().toISOString(), note: `Cancelled by admin: ${reason}` });
    return o;
  }) : http.patch(`/admin/orders/${id}/cancel`, { reason }),
  confirmReturn: (id, note) => USE_MOCK ? mock(() => {
    const o = findBy(db.orders, id, 'orderId');
    if (o.status !== 'return_requested') fail('No return is pending on this order');
    o.status = 'returned';
    o.paymentStatus = 'refunded';
    o.timeline.push({ status: 'returned', at: new Date().toISOString(), note: note || 'Return confirmed by admin' });
    return o;
  }) : http.patch(`/admin/orders/${id}/confirm-return`, { note }),
  getPayments: (params) => USE_MOCK ? mock(() => {
    const result = query(db.payments, params, {
      searchFields: ['paymentId', 'orderId', 'customer.name', 'gatewayRef'],
      filters: { status: (p, s) => p.status === s, method: (p, m) => p.method === m },
    });
    result.summary = {
      collected: sumBy(db.payments.filter((p) => p.status === 'paid'), (p) => p.amount),
      pending: sumBy(db.payments.filter((p) => p.status === 'pending'), (p) => p.amount),
      refunded: sumBy(db.payments.filter((p) => p.status === 'refunded'), (p) => p.amount),
      byMethod: ['cod', 'card', 'wallet'].map((m) => ({ method: m, amount: sumBy(db.payments.filter((p) => p.method === m), (p) => p.amount) })),
    };
    return result;
  }) : http.get('/admin/payments', params),

  // ---------- payouts & settlements ----------
  getVendorBalances: (params) => USE_MOCK ? mock(() => query(db.vendorBalances, { limit: 50, ...params }, { searchFields: ['user.name', 'user.code'] })) : http.get('/admin/payouts/vendors', params),
  getRiderBalances: (params) => USE_MOCK ? mock(() => query(db.riderBalances, { limit: 50, ...params }, { searchFields: ['user.name', 'user.code'] })) : http.get('/admin/payouts/riders', params),
  getUserLedger: (id) => USE_MOCK ? mock(() => db.buildLedger(id)) : http.get(`/admin/payouts/user/${id}`),
  createPayout: ({ userId, amount, method, reference, note }) => USE_MOCK ? mock(() => {
    const bal = [...db.vendorBalances, ...db.riderBalances].find((b) => b.user._id === userId) || fail('User not found', 404);
    if (amount <= 0) fail('Amount must be greater than zero');
    if (amount > bal.balance) fail(`Amount exceeds the outstanding balance of Rs. ${bal.balance.toLocaleString()}`);
    bal.balance -= amount;
    bal.paidOut += amount;
    bal.lastPayoutAt = new Date().toISOString();
    const s = { _id: `s${db.settlements.length + 1}`, settlementId: nextCode('STL', db.settlements, '', 5), type: 'payout', partyType: db.vendorBalances.includes(bal) ? 'vendor' : 'rider', party: { _id: bal.user._id, code: bal.user.code, name: bal.user.name }, amount, method, reference, note, status: 'completed', createdBy: db.me.name, createdAt: new Date().toISOString() };
    db.settlements.unshift(s);
    return s;
  }) : http.post('/admin/payouts', { userId, amount, method, reference, note }),
  recordCashDeposit: ({ riderId, amount, reference, note }) => USE_MOCK ? mock(() => {
    const bal = db.riderBalances.find((b) => b.user._id === riderId) || fail('Rider not found', 404);
    if (amount > bal.codHeld) fail(`Rider only holds Rs. ${bal.codHeld.toLocaleString()} in COD cash`);
    bal.codHeld -= amount;
    bal.lastDepositAt = new Date().toISOString();
    const rider = db.riders.find((r) => r._id === riderId);
    rider.codInHand = bal.codHeld;
    const s = { _id: `s${db.settlements.length + 1}`, settlementId: nextCode('STL', db.settlements, '', 5), type: 'cash_deposit', partyType: 'rider', party: { _id: bal.user._id, code: bal.user.code, name: bal.user.name }, amount, method: 'cash', reference, note, status: 'completed', createdBy: db.me.name, createdAt: new Date().toISOString() };
    db.settlements.unshift(s);
    return s;
  }) : http.post('/admin/payouts/cash-deposit', { riderId, amount, reference, note }),
  getSettlements: (params) => USE_MOCK ? mock(() => query(db.settlements, params, {
    searchFields: ['settlementId', 'party.name', 'party.code', 'reference'],
    filters: { type: (s, t) => s.type === t, partyType: (s, t) => s.partyType === t },
  })) : http.get('/admin/settlements', params),

  // ---------- products ----------
  getProducts: (params) => USE_MOCK ? mock(() => query(db.products, params, {
    searchFields: ['name', 'sku', 'productId', 'vendor.storeName'],
    filters: { status: (p, s) => p.approvalStatus === s, vendorId: (p, v) => p.vendor._id === v, category: (p, c) => p.category === c, stock: (p, s) => (s === 'out' ? p.stock === 0 : s === 'low' ? p.stock > 0 && p.stock <= p.reorderLevel : p.stock > p.reorderLevel) },
  })) : http.get('/admin/products', params),
  getProductById: (id) => USE_MOCK ? mock(() => findBy(db.products, id, 'productId')) : http.get(`/admin/products/${id}`),
  // payload is FormData (multer `images`, max 5) on the live API
  createProduct: (payload) => USE_MOCK ? mock(() => {
    const vendor = db.vendors.find((v) => v._id === payload.vendorId) || fail('Pick a vendor');
    const p = { _id: `p${db.products.length + 1}`, productId: nextCode('PRD', db.products), sku: payload.sku || `${vendor.vendorId}-NEW${db.products.length + 1}`, vendor: { _id: vendor._id, vendorId: vendor.vendorId, storeName: vendor.storeName }, icon: '📦', reorderLevel: 15, soldLast30d: 0, approvalStatus: 'approved', createdAt: new Date().toISOString(), ...withUploads(payload), isActive: payload.isActive ?? true };
    db.products.unshift(p);
    return p;
  }) : http.post('/admin/products', toFormData(payload, 'images')),
  updateProduct: (id, payload) => USE_MOCK ? mock(() => Object.assign(findBy(db.products, id, 'productId'), withUploads(payload))) : http.put(`/admin/products/${id}`, toFormData(payload, 'images')),
  approveProduct: (id, approvalStatus, reason) => USE_MOCK ? mock(() => Object.assign(findBy(db.products, id, 'productId'), { approvalStatus, rejectionReason: reason || null })) : http.patch(`/admin/products/${id}/approve`, { approvalStatus, reason }),
  deleteProduct: (id) => USE_MOCK ? mock(() => { const i = db.products.findIndex((p) => p._id === id); db.products.splice(i, 1); return { deleted: true }; }) : http.delete(`/admin/products/${id}`),

  // ---------- categories ----------
  getCategories: (params) => USE_MOCK ? mock(() => db.categories.filter((c) => !params?.parent || c.parentCategory === params.parent)) : http.get('/admin/categories', params),
  getCategoryById: (id) => USE_MOCK ? mock(() => findBy(db.categories, id, 'categoryId')) : http.get(`/admin/categories/${id}`),
  // payload is FormData (multer `image`) on the live API
  createCategory: (payload) => USE_MOCK ? mock(() => {
    const parent = payload.parentCategory ? db.categories.find((c) => c._id === payload.parentCategory) : null;
    const c = { _id: `cat${Date.now()}`, categoryId: nextCode('CAT', db.categories), slug: payload.name.toLowerCase().replace(/[^a-z]+/g, '-'), icon: parent?.icon || payload.icon || '🛒', productsCount: 0, sortOrder: 99, createdAt: new Date().toISOString(), isActive: true, ...withUploads(payload), parentCategory: payload.parentCategory || null };
    db.categories.push(c);
    return c;
  }) : http.post('/admin/categories', toFormData(payload, 'image')),
  updateCategory: (id, payload) => USE_MOCK ? mock(() => Object.assign(findBy(db.categories, id, 'categoryId'), withUploads(payload))) : http.put(`/admin/categories/${id}`, toFormData(payload, 'image')),
  deleteCategory: (id) => USE_MOCK ? mock(() => {
    if (db.categories.some((c) => c.parentCategory === id)) fail('Remove its sub-categories first');
    db.categories.splice(db.categories.findIndex((c) => c._id === id), 1);
    return { deleted: true };
  }) : http.delete(`/admin/categories/${id}`),

  // ---------- master catalog ----------
  getMasterCatalog: (params) => USE_MOCK ? mock(() => query(db.masterCatalog, params, {
    searchFields: ['name', 'brand', 'barcode', 'masterId'],
    filters: { category: (m, c) => m.category === c, subCategory: (m, c) => m.subCategory === c, status: (m, s) => (s === 'active' ? m.isActive : !m.isActive) },
  })) : http.get('/admin/master-catalog', params),
  getMasterCatalogTree: () => USE_MOCK ? mock(() => db.categories.filter((c) => !c.parentCategory).map((c) => ({
    ...c,
    children: db.categories.filter((s) => s.parentCategory === c._id).map((s) => ({ ...s, products: db.masterCatalog.filter((m) => m.subCategory === s._id) })),
  }))) : http.get('/admin/master-catalog/tree'),
  getMasterProductById: (id) => USE_MOCK ? mock(() => findBy(db.masterCatalog, id, 'masterId')) : http.get(`/admin/master-catalog/${id}`),
  createMasterProduct: (payload) => USE_MOCK ? mock(() => {
    const m = { _id: `m${Date.now()}`, masterId: nextCode('MCP', db.masterCatalog), icon: '📦', vendorsUsing: 0, isActive: true, createdAt: new Date().toISOString(), ...withUploads(payload) };
    db.masterCatalog.unshift(m);
    return m;
  }) : http.post('/admin/master-catalog', toFormData(payload, 'images')),
  bulkCreateMasterProducts: (items) => USE_MOCK ? mock(() => {
    const created = items.map((it) => ({ _id: `m${Date.now()}${Math.random()}`, masterId: nextCode('MCP', db.masterCatalog), icon: '📦', vendorsUsing: 0, isActive: true, createdAt: new Date().toISOString(), ...it }));
    created.forEach((m, i) => { m.masterId = `MCP${String(db.masterCatalog.length + 1 + i).padStart(4, '0')}`; });
    db.masterCatalog.unshift(...created);
    return { created: created.length, failed: 0 };
  }) : http.post('/admin/master-catalog/bulk', { items }),
  updateMasterProduct: (id, payload) => USE_MOCK ? mock(() => Object.assign(findBy(db.masterCatalog, id, 'masterId'), withUploads(payload))) : http.put(`/admin/master-catalog/${id}`, toFormData(payload, 'images')),
  deleteMasterProduct: (id) => USE_MOCK ? mock(() => { db.masterCatalog.splice(db.masterCatalog.findIndex((m) => m._id === id), 1); return { deleted: true }; }) : http.delete(`/admin/master-catalog/${id}`),

  // ---------- inventory ----------
  getInventoryOverview: (params) => USE_MOCK ? mock(() => {
    const rows = query(db.products, { limit: 12, ...params }, {
      searchFields: ['name', 'sku', 'vendor.storeName'],
      filters: { vendorId: (p, v) => p.vendor._id === v, stock: (p, s) => (s === 'out' ? p.stock === 0 : s === 'low' ? p.stock > 0 && p.stock <= p.reorderLevel : p.stock > p.reorderLevel) },
    });
    const byVendor = db.vendors.filter((v) => v.approvalStatus === 'approved').map((v) => {
      const items = db.products.filter((p) => p.vendor._id === v._id);
      return { vendor: { _id: v._id, storeName: v.storeName, vendorId: v.vendorId }, skus: items.length, low: items.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length, out: items.filter((p) => p.stock === 0).length };
    });
    return {
      ...rows,
      summary: {
        totalSkus: db.products.length,
        inStock: db.products.filter((p) => p.stock > p.reorderLevel).length,
        lowStock: db.products.filter((p) => p.stock > 0 && p.stock <= p.reorderLevel).length,
        outOfStock: db.products.filter((p) => p.stock === 0).length,
        stockValue: sumBy(db.products, (p) => p.stock * p.price),
      },
      byVendor,
    };
  }) : http.get('/admin/inventory', params),

  // ---------- reports ----------
  getSalesReport: (params = {}) => USE_MOCK ? mock(() => {
    const series = salesSeries(Number(params.days) || 30);
    return { series, totals: { orders: sumBy(series, (d) => d.orders), gmv: sumBy(series, (d) => d.gmv), aov: Math.round(sumBy(series, (d) => d.gmv) / sumBy(series, (d) => d.orders)) } };
  }) : http.get('/admin/reports/sales', params),
  getRevenueReport: (params = {}) => USE_MOCK ? mock(() => {
    const series = salesSeries(Number(params.days) || 30);
    const commission = sumBy(series, (d) => d.commission);
    const deliveryFees = sumBy(series, (d) => d.deliveryFees);
    const refunds = sumBy(series, (d) => d.refunds);
    const discounts = Math.round(commission * 0.18);
    return { series, breakdown: { commission, deliveryFees, darkStoreMargin: Math.round(commission * 0.64), discounts, refunds, net: commission + deliveryFees + Math.round(commission * 0.64) - discounts - refunds } };
  }) : http.get('/admin/reports/revenue', params),
  getVendorReport: (params) => USE_MOCK ? mock(() => db.vendors.filter((v) => v.approvalStatus === 'approved').map((v) => ({ vendor: { _id: v._id, vendorId: v.vendorId, storeName: v.storeName, storeType: v.storeType }, orders: v.totalOrders, gmv: v.grossSales, commission: Math.round(v.grossSales * v.commissionPercent / 100), rating: v.rating, fulfilmentRate: v.fulfilmentRate, avgPrepMinutes: v.avgPrepMinutes, cancellations: Math.round(v.totalOrders * 0.018) })).sort((a, b) => b.gmv - a.gmv)) : http.get('/admin/reports/vendors', params),
  getRiderReport: (params) => USE_MOCK ? mock(() => db.riders.filter((r) => r.approvalStatus === 'approved').map((r) => ({ rider: { _id: r._id, riderId: r.riderId, name: r.name, zone: r.zone }, deliveries: r.totalDeliveries, onTimeRate: r.onTimeRate, rating: r.rating, avgDeliveryMin: 8 + (r.totalDeliveries % 7), earnings: r.totalDeliveries * 85, codCollected: r.totalDeliveries * 1240 })).sort((a, b) => b.deliveries - a.deliveries)) : http.get('/admin/reports/riders', params),

  // ---------- settings ----------
  getSettings: () => (USE_MOCK ? mock(() => db.settings) : http.get('/admin/settings')),
  updateRadiusSettings: (payload) => USE_MOCK ? mock(() => { Object.assign(db.settings.radius, payload); db.settings.updatedAt = new Date().toISOString(); return db.settings; }) : http.put('/admin/settings/radius', payload),
  updateCommissionSettings: (percent) => USE_MOCK ? mock(() => { db.settings.commission.percent = percent; db.settings.updatedAt = new Date().toISOString(); return db.settings; }) : http.put('/admin/settings/commission', { percent }),
  updateGeneralSettings: (payload) => USE_MOCK ? mock(() => { Object.assign(db.settings.general, payload); db.settings.updatedAt = new Date().toISOString(); return db.settings; }) : http.put('/admin/settings/general', payload),

  // ---------- employees ----------
  getEmployees: (params) => USE_MOCK ? mock(() => query(db.employees, { limit: 50, ...params }, { searchFields: ['name', 'email', 'designation', 'employeeId'] })) : http.get('/admin/employees', params),
  getEmployeeById: (id) => USE_MOCK ? mock(() => findBy(db.employees, id, 'employeeId')) : http.get(`/admin/employees/${id}`),
  createEmployee: (payload) => USE_MOCK ? mock(() => {
    if (db.employees.some((e) => e.email === payload.email)) fail('An employee with this email already exists');
    const rest = withoutPassword(payload);
    const e = { _id: `e${Date.now()}`, employeeId: nextCode('EMP', db.employees), isActive: true, lastLoginAt: null, createdAt: new Date().toISOString(), ...rest };
    db.employees.unshift(e);
    return e;
  }) : http.post('/admin/employees', payload),
  updateEmployee: (id, payload) => USE_MOCK ? mock(() => { const rest = withoutPassword(payload); return Object.assign(findBy(db.employees, id, 'employeeId'), rest); }) : http.put(`/admin/employees/${id}`, payload),
  deleteEmployee: (id) => USE_MOCK ? mock(() => { db.employees.splice(db.employees.findIndex((e) => e._id === id), 1); return { deleted: true }; }) : http.delete(`/admin/employees/${id}`),

  // ---------- shell helpers (not admin routes) ----------
  getNotifications: () => (USE_MOCK ? mock(() => db.notifications) : Promise.resolve(db.notifications)),
};

// Multer routes expect multipart: plain fields + File objects under one key.
function toFormData(payload, fileKey) {
  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === fileKey) [].concat(value).forEach((file) => file instanceof File && form.append(fileKey, file));
    else form.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
  });
  return form;
}

// ---------- auth (routes/authRoutes.js) ----------
export const authApi = {
  login: (identifier, password) => USE_MOCK
    ? mock(() => {
      if (!identifier || !password) fail('Enter your email and password');
      if (password.length < 4) fail('Incorrect email or password', 401);
      return { accessToken: 'mock-token', user: db.me };
    })
    : http.post('/auth/login', { identifier, password }),
  logout: () => (USE_MOCK ? wait(150) : http.post('/auth/logout')),
};
