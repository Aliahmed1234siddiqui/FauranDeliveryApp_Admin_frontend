// In-memory mock database. Shapes mirror what the Node backend returns so the
// pages keep working unchanged once `VITE_USE_MOCK=false` points them at the real API.

let seed = 20261013;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const pick = (list) => list[Math.floor(rand() * list.length)];
const between = (min, max) => Math.round(min + rand() * (max - min));
const pad = (n, len = 4) => String(n).padStart(len, '0');
const daysAgo = (d, h = 10, m = 0) => {
  const date = new Date('2026-10-13T00:00:00');
  date.setDate(date.getDate() - d);
  date.setHours(h, m, 0, 0);
  return date.toISOString();
};

// ---------- permissions (mirrors config/permissions.js) ----------
export const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'KPIs, charts and live marketplace pulse' },
  { key: 'vendors', label: 'Vendors', description: 'Review, approve and manage stores' },
  { key: 'riders', label: 'Riders', description: 'Rider onboarding, live map and approvals' },
  { key: 'customers', label: 'Customers', description: 'Customer accounts, status and COD access' },
  { key: 'orders', label: 'Orders', description: 'Order lookup, cancellations and returns' },
  { key: 'payments', label: 'Payments & payouts', description: 'Transactions, vendor/rider payouts, COD deposits' },
  { key: 'products', label: 'Products', description: 'Vendor product listings and approvals' },
  { key: 'catalog', label: 'Catalog', description: 'Categories and the master product catalog' },
  { key: 'inventory', label: 'Inventory', description: 'Stock levels and low-stock alerts' },
  { key: 'reports', label: 'Reports', description: 'Sales, revenue, vendor and rider reports' },
  { key: 'settings', label: 'Settings', description: 'Delivery radius, commission and general settings' },
  { key: 'employees', label: 'Employees', description: 'Sub-admin accounts and their access' },
];

// ---------- vendors ----------
const areas = ['Gulberg III', 'DHA Phase 5', 'Model Town', 'Johar Town', 'Wapda Town', 'Bahria Town', 'Garden Town', 'Cantt', 'Faisal Town', 'Iqbal Town'];
const vendorSeed = [
  ['Fauran Gulberg Hub', 'dark_store', 'Fauran Operations'],
  ['Khan General Store', 'partner_kiryana', 'Muhammad Khan'],
  ['Fresh Basket Model Town', 'partner_kiryana', 'Sana Qureshi'],
  ['Fauran Johar Town Hub', 'dark_store', 'Fauran Operations'],
  ['Al-Madina Mart', 'partner_kiryana', 'Adeel Raza'],
  ['Daily Needs Bahria', 'partner_kiryana', 'Hira Malik'],
  ['Green Valley Superstore', 'partner_kiryana', 'Faisal Butt'],
  ['Fauran DHA Hub', 'dark_store', 'Fauran Operations'],
  ['City Kiryana & Co.', 'partner_kiryana', 'Rashid Mehmood'],
  ['Rehman Grocers', 'partner_kiryana', 'Abdul Rehman'],
  ['Shaheen Cash & Carry', 'partner_kiryana', 'Shaheen Akhtar'],
  ['Pak Mart Garden Town', 'partner_kiryana', 'Nadia Pervaiz'],
];
const vendorStatuses = ['approved', 'approved', 'pending', 'approved', 'approved', 'approved', 'pending', 'approved', 'rejected', 'approved', 'pending', 'approved'];

export const vendors = vendorSeed.map(([storeName, storeType, ownerName], i) => {
  const approvalStatus = vendorStatuses[i];
  const live = approvalStatus === 'approved';
  return {
    _id: `v${i + 1}`,
    vendorId: `VEN${pad(i + 1)}`,
    storeName,
    ownerName,
    storeType,
    email: `${storeName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '')}${i + 1}@vendors.fauran.pk`,
    phone: `+92 3${between(0, 4)}${between(0, 9)} ${between(100, 999)} ${between(1000, 9999)}`,
    city: 'Lahore',
    area: areas[i % areas.length],
    address: `Plot ${between(10, 240)}, ${areas[i % areas.length]}, Lahore`,
    approvalStatus,
    isActive: i !== 4,
    rating: live ? +(4 + rand() * 0.9).toFixed(1) : 0,
    totalOrders: live ? between(600, 5200) : 0,
    productsCount: between(180, 1300),
    grossSales: live ? between(900000, 9800000) : 0,
    commissionPercent: storeType === 'dark_store' ? 0 : 12,
    fulfilmentRate: live ? +(90 + rand() * 9.5).toFixed(1) : 0,
    avgPrepMinutes: live ? between(4, 11) : 0,
    documents: [
      { name: 'Business license.pdf', verified: live },
      { name: 'Owner CNIC (front & back).pdf', verified: live },
      { name: 'Storefront photos.zip', verified: approvalStatus !== 'rejected' },
    ],
    bank: { title: ownerName, bankName: pick(['Meezan Bank', 'HBL', 'UBL', 'Bank Alfalah']), iban: `PK${between(10, 99)}XXXX${between(1000, 9999)}${between(1000, 9999)}` },
    createdAt: approvalStatus === 'pending' ? daysAgo(between(0, 6)) : daysAgo(between(90, 640)),
  };
});

// ---------- riders ----------
const riderNames = ['Hamza Tariq', 'Bilal Ahmed', 'Usman Khalid', 'Maha Iqbal', 'Talha Rauf', 'Saad Javed', 'Ahmed Nawaz', 'Waqas Ali', 'Zeeshan Haider', 'Imran Shah', 'Kamran Yousaf', 'Danish Akram', 'Junaid Asif', 'Noman Bashir'];
const riderApproval = ['approved', 'approved', 'approved', 'pending', 'approved', 'approved', 'approved', 'pending', 'approved', 'approved', 'rejected', 'approved', 'approved', 'approved'];
export const riders = riderNames.map((name, i) => {
  const approvalStatus = riderApproval[i];
  const live = approvalStatus === 'approved';
  const isOnline = live && rand() > 0.3;
  return {
    _id: `r${i + 1}`,
    riderId: `RDR${pad(i + 1)}`,
    name,
    phone: `+92 3${between(0, 4)}${between(0, 9)} ${between(100, 999)} ${between(1000, 9999)}`,
    email: `${name.split(' ')[0].toLowerCase()}@riders.fauran.pk`,
    cnic: `35202-${between(1000000, 9999999)}-${between(1, 9)}`,
    vehicleType: pick(['Motorbike', 'Motorbike', 'Motorbike', 'E-bike']),
    vehicleNumber: `LE${between(10, 25)}-${between(1000, 9999)}`,
    zone: areas[i % areas.length],
    approvalStatus,
    isActive: i !== 9,
    isOnline,
    currentStatus: isOnline ? pick(['idle', 'delivering', 'delivering']) : 'offline',
    rating: live ? +(4.2 + rand() * 0.8).toFixed(1) : 0,
    totalDeliveries: live ? between(150, 2200) : 0,
    onTimeRate: live ? +(88 + rand() * 11).toFixed(1) : 0,
    codInHand: live ? between(0, 38000) : 0,
    location: { x: between(8, 92), y: between(10, 88), lastPingSec: between(2, 55) },
    createdAt: approvalStatus === 'pending' ? daysAgo(between(0, 5)) : daysAgo(between(60, 600)),
  };
});

// ---------- customers ----------
const customerNames = ['Ayesha Siddiqui', 'Ali Zain', 'Sara Mahmood', 'Zainab Hassan', 'Omar Farooq', 'Hina Aslam', 'Maryam Nadeem', 'Fahad Mir', 'Nida Arshad', 'Usama Riaz', 'Rabia Anwar', 'Hassan Raza', 'Mehwish Tahir', 'Asad Qamar', 'Iqra Shahid', 'Bilal Sheikh', 'Areeba Khan', 'Shoaib Akhtar'];
export const customers = customerNames.map((name, i) => {
  const totalOrders = between(1, 64);
  return {
    _id: `c${i + 1}`,
    customerId: `CUS${pad(i + 1)}`,
    name,
    email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: `+92 3${between(0, 4)}${between(0, 9)} ${between(100, 999)} ${between(1000, 9999)}`,
    isActive: ![3, 11].includes(i),
    codEnabled: ![3, 7, 14].includes(i),
    totalOrders,
    totalSpent: totalOrders * between(1400, 3200),
    cancelledOrders: between(0, Math.max(1, Math.floor(totalOrders / 8))),
    addresses: [`House ${between(1, 300)}, ${pick(areas)}, Lahore`],
    lastOrderAt: daysAgo(between(0, 40), between(8, 22)),
    createdAt: daysAgo(between(30, 700)),
  };
});

// ---------- categories ----------
const categorySeed = [
  ['Fruits & Vegetables', '🥬', ['Fresh fruits', 'Fresh vegetables', 'Herbs & seasonings']],
  ['Dairy & Breakfast', '🥛', ['Milk', 'Eggs', 'Bread & buns', 'Cereals']],
  ['Bakery', '🍞', ['Cakes', 'Rusks & biscuits']],
  ['Household', '🧴', ['Detergents', 'Cleaners', 'Tissues']],
  ['Snacks & Beverages', '🍪', ['Chips', 'Soft drinks', 'Juices', 'Tea & coffee']],
  ['Personal Care', '🧼', ['Bath & body', 'Hair care', 'Oral care']],
  ['Staples', '🍚', ['Rice', 'Flour', 'Pulses', 'Cooking oil']],
  ['Pet Care', '🐾', ['Pet food']],
];
export const categories = [];
categorySeed.forEach(([name, icon, subs], i) => {
  const parentId = `cat${i + 1}`;
  categories.push({ _id: parentId, categoryId: `CAT${pad(i + 1)}`, name, slug: name.toLowerCase().replace(/[^a-z]+/g, '-'), icon, image: null, parentCategory: null, isActive: i !== 7, sortOrder: i + 1, productsCount: 0, createdAt: daysAgo(400 - i) });
  subs.forEach((sub, j) => {
    categories.push({ _id: `${parentId}-${j + 1}`, categoryId: `CAT${pad(i + 1)}${pad(j + 1, 2)}`, name: sub, slug: sub.toLowerCase().replace(/[^a-z]+/g, '-'), icon, image: null, parentCategory: parentId, isActive: true, sortOrder: j + 1, productsCount: between(8, 90), createdAt: daysAgo(380 - j) });
  });
});
categories.forEach((c) => {
  if (!c.parentCategory) c.productsCount = categories.filter((s) => s.parentCategory === c._id).reduce((sum, s) => sum + s.productsCount, 0);
});

// ---------- master catalog ----------
const masterSeed = [
  ['Nestlé Milkpak UHT Milk', 'Nestlé', 'cat2-1', '1 L', 340, '🥛'],
  ['Olpers Full Cream Milk', 'Engro', 'cat2-1', '1 L', 330, '🥛'],
  ['Farm Fresh Eggs (Dozen)', 'Fauran Fresh', 'cat2-2', '12 pcs', 420, '🥚'],
  ['Dawn Bread Large', 'Dawn', 'cat2-3', '1 pack', 210, '🍞'],
  ['Kellogg\'s Corn Flakes', 'Kellogg\'s', 'cat2-4', '500 g', 1150, '🥣'],
  ['Bananas', 'Fauran Fresh', 'cat1-1', '1 dozen', 260, '🍌'],
  ['Red Apples (Kala Kulu)', 'Fauran Fresh', 'cat1-1', '1 kg', 480, '🍎'],
  ['Tomatoes', 'Fauran Fresh', 'cat1-2', '1 kg', 190, '🍅'],
  ['Onions', 'Fauran Fresh', 'cat1-2', '1 kg', 160, '🧅'],
  ['Surf Excel Washing Powder', 'Unilever', 'cat4-1', '1 kg', 720, '🧺'],
  ['Lays Masala Chips', 'PepsiCo', 'cat5-1', '70 g', 100, '🥔'],
  ['Coca-Cola', 'Coca-Cola', 'cat5-2', '1.5 L', 210, '🥤'],
  ['Nestlé Fruita Vitals Orange', 'Nestlé', 'cat5-3', '1 L', 360, '🧃'],
  ['Tapal Danedar Tea', 'Tapal', 'cat5-4', '950 g', 1650, '🍵'],
  ['Super Basmati Rice', 'Guard', 'cat7-1', '5 kg', 2450, '🍚'],
  ['Sunridge Chakki Atta', 'Sunridge', 'cat7-2', '10 kg', 1580, '🌾'],
  ['Dalda Cooking Oil', 'Dalda', 'cat7-4', '3 L', 1780, '🫒'],
  ['Colgate Toothpaste', 'Colgate', 'cat6-3', '150 g', 330, '🪥'],
  ['Head & Shoulders Shampoo', 'P&G', 'cat6-2', '360 ml', 980, '🧴'],
  ['Lipton Yellow Label', 'Unilever', 'cat5-4', '475 g', 1290, '🍵'],
];
export const masterCatalog = masterSeed.map(([name, brand, subCategory, unit, mrp, icon], i) => ({
  _id: `m${i + 1}`,
  masterId: `MCP${pad(i + 1)}`,
  name,
  brand,
  category: subCategory.split('-')[0],
  subCategory,
  unit,
  mrp,
  barcode: `8964000${between(100000, 999999)}`,
  icon,
  images: [],
  description: `${name} - standard listing used by all vendors.`,
  vendorsUsing: between(1, 9),
  isActive: i !== 13,
  createdAt: daysAgo(between(20, 300)),
}));

// ---------- vendor products ----------
export const products = [];
vendors.filter((v) => v.approvalStatus !== 'rejected').forEach((v, vi) => {
  masterCatalog.slice(vi % 5, (vi % 5) + 7).forEach((m, mi) => {
    const price = Math.round(m.mrp * (0.92 + rand() * 0.1));
    const stock = between(0, 140);
    products.push({
      _id: `p${products.length + 1}`,
      productId: `PRD${pad(products.length + 1)}`,
      name: m.name,
      sku: `${v.vendorId}-${m.masterId}`,
      masterProductId: m.masterId,
      vendor: { _id: v._id, vendorId: v.vendorId, storeName: v.storeName },
      category: m.category,
      subCategory: m.subCategory,
      icon: m.icon,
      unit: m.unit,
      mrp: m.mrp,
      price,
      salePrice: rand() > 0.75 ? Math.round(price * 0.9) : null,
      stock,
      reorderLevel: 15,
      approvalStatus: v.approvalStatus === 'pending' ? 'pending' : (vi + mi) % 9 === 0 ? 'pending' : (vi + mi) % 13 === 0 ? 'rejected' : 'approved',
      isActive: stock > 0,
      soldLast30d: between(0, 240),
      createdAt: daysAgo(between(1, 200)),
    });
  });
});

// ---------- orders ----------
const ORDER_FLOW = ['placed', 'accepted', 'preparing', 'ready', 'rider_assigned', 'picked_up', 'on_the_way', 'delivered'];
const statusMix = ['delivered', 'delivered', 'delivered', 'delivered', 'on_the_way', 'preparing', 'placed', 'rider_assigned', 'cancelled', 'picked_up', 'delivered', 'return_requested', 'accepted', 'ready', 'returned'];
const approvedVendors = vendors.filter((v) => v.approvalStatus === 'approved');
const activeRiders = riders.filter((r) => r.approvalStatus === 'approved');
export const orders = Array.from({ length: 64 }, (_, i) => {
  const vendor = pick(approvedVendors);
  const customer = pick(customers);
  const status = statusMix[i % statusMix.length];
  const vendorProducts = products.filter((p) => p.vendor._id === vendor._id);
  const pool = [...(vendorProducts.length ? vendorProducts : products)];
  const items = Array.from({ length: Math.min(pool.length, between(1, 4)) }, () => {
    const p = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    const qty = between(1, 3);
    return { productId: p.productId, name: p.name, icon: p.icon, qty, price: p.salePrice || p.price };
  });
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const deliveryFee = subtotal > 2000 ? 0 : 149;
  const discount = rand() > 0.8 ? 100 : 0;
  const day = Math.floor(i / 6);
  const createdAt = daysAgo(day, 22 - (i % 6) * 2, between(0, 59));
  const hasRider = ['rider_assigned', 'picked_up', 'on_the_way', 'delivered', 'return_requested', 'returned'].includes(status);
  const paymentMethod = pick(['cod', 'cod', 'cod', 'card', 'wallet']);
  const reached = status === 'cancelled' ? 2 : status.startsWith('return') ? ORDER_FLOW.length : ORDER_FLOW.indexOf(status) + 1;
  const timeline = ORDER_FLOW.slice(0, reached).map((s, k) => ({ status: s, at: new Date(new Date(createdAt).getTime() + k * 4 * 60000).toISOString() }));
  if (status === 'cancelled') timeline.push({ status: 'cancelled', at: new Date(new Date(createdAt).getTime() + 9 * 60000).toISOString(), note: 'Customer changed their mind' });
  if (status.startsWith('return')) timeline.push({ status: 'return_requested', at: new Date(new Date(createdAt).getTime() + 3 * 3600000).toISOString(), note: 'Item damaged on arrival' });
  if (status === 'returned') timeline.push({ status: 'returned', at: new Date(new Date(createdAt).getTime() + 26 * 3600000).toISOString() });
  return {
    _id: `o${i + 1}`,
    orderId: `ORD${createdAt.slice(0, 10).replace(/-/g, '')}${pad(i + 1)}`,
    customer: { _id: customer._id, customerId: customer.customerId, name: customer.name, phone: customer.phone },
    vendor: { _id: vendor._id, vendorId: vendor.vendorId, storeName: vendor.storeName },
    rider: hasRider ? (({ _id, riderId, name, phone }) => ({ _id, riderId, name, phone }))(pick(activeRiders)) : null,
    items,
    subtotal,
    deliveryFee,
    discount,
    total: subtotal + deliveryFee - discount,
    commission: Math.round(subtotal * (vendor.commissionPercent / 100)),
    paymentMethod,
    paymentStatus: status === 'cancelled' ? (paymentMethod === 'cod' ? 'void' : 'refunded') : status === 'returned' ? 'refunded' : paymentMethod === 'cod' && status !== 'delivered' ? 'pending' : 'paid',
    status,
    address: customer.addresses[0],
    etaMinutes: between(8, 16),
    timeline,
    createdAt,
  };
});

// ---------- payments ----------
export const payments = orders
  .filter((o) => o.paymentStatus !== 'void')
  .map((o, i) => ({
    _id: `pay${i + 1}`,
    paymentId: `PAY${o.orderId.slice(3)}`,
    orderId: o.orderId,
    customer: o.customer,
    vendor: o.vendor,
    method: o.paymentMethod,
    amount: o.total,
    status: o.paymentStatus,
    gatewayRef: o.paymentMethod === 'cod' ? null : `TXN${between(10000000, 99999999)}`,
    createdAt: o.createdAt,
  }));

// ---------- settlements & ledgers ----------
export const settlements = [];
const addSettlement = (s) => settlements.push({ _id: `s${settlements.length + 1}`, settlementId: `STL${pad(settlements.length + 1, 5)}`, status: 'completed', createdBy: 'Arsalan Malik', ...s });
approvedVendors.slice(0, 7).forEach((v, i) => addSettlement({ type: 'payout', partyType: 'vendor', party: { _id: v._id, code: v.vendorId, name: v.storeName }, amount: between(40000, 260000), method: pick(['bank_transfer', 'bank_transfer', 'jazzcash']), reference: `IBFT${between(100000, 999999)}`, note: 'Weekly settlement', createdAt: daysAgo(i * 2 + 1, 15) }));
activeRiders.slice(0, 6).forEach((r, i) => {
  addSettlement({ type: 'cash_deposit', partyType: 'rider', party: { _id: r._id, code: r.riderId, name: r.name }, amount: between(8000, 42000), method: 'cash', reference: `DEP${between(10000, 99999)}`, note: 'COD cash handed over at hub', createdAt: daysAgo(i, 21) });
  if (i % 2 === 0) addSettlement({ type: 'payout', partyType: 'rider', party: { _id: r._id, code: r.riderId, name: r.name }, amount: between(6000, 18000), method: pick(['easypaisa', 'jazzcash']), reference: `EP${between(100000, 999999)}`, note: 'Weekly rider earnings', createdAt: daysAgo(i + 3, 18) });
});
settlements.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const vendorBalances = vendors.filter((v) => v.approvalStatus === 'approved').map((v) => {
  const grossSales = Math.round(v.grossSales / 10);
  const commission = Math.round(grossSales * (v.commissionPercent / 100));
  const paidOut = settlements.filter((s) => s.party._id === v._id && s.type === 'payout').reduce((sum, s) => sum + s.amount, 0);
  const netEarnings = grossSales - commission;
  return { user: { _id: v._id, code: v.vendorId, name: v.storeName, sub: v.ownerName, storeType: v.storeType }, grossSales, commission, netEarnings, paidOut, balance: Math.max(0, netEarnings - paidOut), lastPayoutAt: settlements.find((s) => s.party._id === v._id)?.createdAt || null };
});

export const riderBalances = activeRiders.map((r) => {
  const earnings = r.totalDeliveries * 85;
  const paidOut = settlements.filter((s) => s.party._id === r._id && s.type === 'payout').reduce((sum, s) => sum + s.amount, 0) + Math.round(earnings * 0.82);
  return { user: { _id: r._id, code: r.riderId, name: r.name, sub: r.zone }, earnings, paidOut, balance: Math.max(0, earnings - paidOut), codHeld: r.codInHand, lastDepositAt: settlements.find((s) => s.party._id === r._id && s.type === 'cash_deposit')?.createdAt || null };
});

export function buildLedger(userId) {
  const vendor = vendors.find((v) => v._id === userId || v.vendorId === userId);
  const rider = riders.find((r) => r._id === userId || r.riderId === userId);
  const entries = [];
  if (vendor) {
    orders.filter((o) => o.vendor._id === vendor._id && o.status === 'delivered').slice(0, 10).forEach((o) => {
      entries.push({ at: o.createdAt, type: 'order_earning', ref: o.orderId, description: `Order ${o.orderId} delivered`, credit: o.subtotal, debit: 0 });
      if (o.commission) entries.push({ at: o.createdAt, type: 'commission', ref: o.orderId, description: `Platform commission (${vendor.commissionPercent}%)`, credit: 0, debit: o.commission });
    });
  }
  if (rider) {
    orders.filter((o) => o.rider?._id === rider._id && o.status === 'delivered').slice(0, 10).forEach((o) => {
      entries.push({ at: o.createdAt, type: 'delivery_fee', ref: o.orderId, description: `Delivery earning ${o.orderId}`, credit: 85, debit: 0 });
      if (o.paymentMethod === 'cod') entries.push({ at: o.createdAt, type: 'cod_collected', ref: o.orderId, description: 'COD cash collected from customer', credit: 0, debit: o.total });
    });
  }
  settlements.filter((s) => s.party._id === (vendor || rider)?._id).forEach((s) => entries.push({ at: s.createdAt, type: s.type, ref: s.settlementId, description: s.type === 'payout' ? `Payout via ${s.method.replace('_', ' ')}` : 'Cash deposited at hub', credit: s.type === 'cash_deposit' ? s.amount : 0, debit: s.type === 'payout' ? s.amount : 0 }));
  entries.sort((a, b) => a.at.localeCompare(b.at));
  let running = 0;
  entries.forEach((e) => { running += e.credit - e.debit; e.balance = running; });
  return { user: vendor ? { _id: vendor._id, code: vendor.vendorId, name: vendor.storeName, role: 'vendor' } : rider ? { _id: rider._id, code: rider.riderId, name: rider.name, role: 'rider' } : null, entries: entries.reverse(), balance: running };
}

// ---------- settings ----------
export const settings = {
  radius: { initialKm: 2, stepKm: 1, maxKm: 6, timeoutSec: 45 },
  commission: { percent: 12 },
  general: {
    platformName: 'Fauran',
    supportEmail: 'support@fauran.pk',
    supportPhone: '+92 42 111 328 726',
    currency: 'PKR',
    baseDeliveryFee: 149,
    freeDeliveryThreshold: 2000,
    minOrderValue: 300,
    codLimit: 15000,
    autoCancelMinutes: 10,
    returnWindowHours: 24,
    maintenanceMode: false,
    acceptingOrders: true,
  },
  updatedAt: daysAgo(2, 16, 20),
};

// ---------- employees ----------
export const employees = [
  { name: 'Sana Khan', designation: 'Operations Lead', permissions: ['dashboard', 'vendors', 'riders', 'orders', 'customers'] },
  { name: 'Hassan Ali', designation: 'Customer Support', permissions: ['orders', 'customers'] },
  { name: 'Mariam Javed', designation: 'Finance Manager', permissions: ['dashboard', 'payments', 'reports'] },
  { name: 'Faraz Ahmed', designation: 'Catalog Executive', permissions: ['products', 'catalog', 'inventory'] },
  { name: 'Komal Rafiq', designation: 'Growth Analyst', permissions: ['dashboard', 'reports'] },
].map((e, i) => ({
  _id: `e${i + 1}`,
  employeeId: `EMP${pad(i + 1)}`,
  ...e,
  email: `${e.name.split(' ')[0].toLowerCase()}@fauran.pk`,
  phone: `+92 3${between(0, 4)}${between(0, 9)} ${between(100, 999)} ${between(1000, 9999)}`,
  isActive: i !== 4,
  lastLoginAt: daysAgo(between(0, 9), between(8, 19)),
  createdAt: daysAgo(between(40, 400)),
}));

export const me = {
  _id: 'admin1',
  name: 'Arsalan Malik',
  email: 'arsalan@fauran.pk',
  phone: '+92 300 111 2244',
  role: 'admin',
  isSuperAdmin: true,
  designation: 'Super admin',
  permissions: PERMISSIONS.map((p) => p.key),
  lastLoginAt: daysAgo(0, 9, 12),
};

// ---------- notifications for the top bar ----------
export const notifications = [
  { id: 'n1', kind: 'vendor', title: '3 vendor applications waiting', detail: 'Fresh Basket Model Town and 2 others', at: daysAgo(0, 11, 2), path: '/vendors?status=pending' },
  { id: 'n2', kind: 'inventory', title: 'Low stock at Gulberg Hub', detail: '6 SKUs below reorder level', at: daysAgo(0, 10, 40), path: '/inventory' },
  { id: 'n3', kind: 'order', title: 'Return requested', detail: 'Customer reported a damaged item', at: daysAgo(0, 9, 55), path: '/orders?status=return_requested' },
  { id: 'n4', kind: 'payments', title: 'COD cash above limit', detail: '2 riders hold over Rs. 30,000', at: daysAgo(1, 18, 5), path: '/payouts?tab=riders' },
];
