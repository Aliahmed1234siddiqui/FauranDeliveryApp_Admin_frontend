import { lazy } from 'react';

import { matchPath } from './match-path';

// Each page is its own chunk, loaded the first time it is opened.
const Dashboard = lazy(() => import('@/pages/dashboard/dashboard-page'));
const Orders = lazy(() => import('@/pages/orders/orders-page'));
const OrderDetail = lazy(() => import('@/pages/orders/order-detail-page'));
const Vendors = lazy(() => import('@/pages/vendors/vendors-page'));
const VendorDetail = lazy(() => import('@/pages/vendors/vendor-detail-page'));
const Riders = lazy(() => import('@/pages/riders/riders-page'));
const RiderDetail = lazy(() => import('@/pages/riders/rider-detail-page'));
const LiveRiders = lazy(() => import('@/pages/riders/live-riders-page'));
const Customers = lazy(() => import('@/pages/customers/customers-page'));
const CustomerDetail = lazy(() => import('@/pages/customers/customer-detail-page'));
const Payments = lazy(() => import('@/pages/finance/payments-page'));
const Payouts = lazy(() => import('@/pages/finance/payouts-page'));
const Products = lazy(() => import('@/pages/catalog/products-page'));
const Categories = lazy(() => import('@/pages/catalog/categories-page'));
const MasterCatalog = lazy(() => import('@/pages/catalog/master-catalog-page'));
const Inventory = lazy(() => import('@/pages/catalog/inventory-page'));
const Reports = lazy(() => import('@/pages/reports/reports-page'));
const Employees = lazy(() => import('@/pages/administration/employees-page'));
const Settings = lazy(() => import('@/pages/administration/settings-page'));
const Profile = lazy(() => import('@/pages/profile/profile-page'));

/**
 * The page table.
 *   path   pattern matched against the URL (`:id` becomes params.id)
 *   perm   the admin needs any one of these permissions ([] = every admin)
 *   crumbs breadcrumb trail: 'Label', ['Label', '/link'] or ':id' for the param
 *
 * Order matters: static segments ("/riders/live") must come before params ("/riders/:id").
 * Keep paths in sync with router/paths.js.
 */
export const ROUTES = [
  { path: '/', component: Dashboard, perm: ['dashboard'], crumbs: [] },
  { path: '/orders', component: Orders, perm: ['orders'], crumbs: ['Orders'] },
  { path: '/orders/:id', component: OrderDetail, perm: ['orders'], crumbs: [['Orders', '/orders'], ':id'] },
  { path: '/vendors', component: Vendors, perm: ['vendors'], crumbs: ['Vendors'] },
  {
    path: '/vendors/:id',
    component: VendorDetail,
    perm: ['vendors'],
    crumbs: [['Vendors', '/vendors'], ':id'],
  },
  { path: '/riders', component: Riders, perm: ['riders'], crumbs: ['Riders'] },
  {
    path: '/riders/live',
    component: LiveRiders,
    perm: ['riders'],
    crumbs: [['Riders', '/riders'], 'Live map'],
  },
  { path: '/riders/:id', component: RiderDetail, perm: ['riders'], crumbs: [['Riders', '/riders'], ':id'] },
  { path: '/customers', component: Customers, perm: ['customers'], crumbs: ['Customers'] },
  {
    path: '/customers/:id',
    component: CustomerDetail,
    perm: ['customers'],
    crumbs: [['Customers', '/customers'], ':id'],
  },
  { path: '/payments', component: Payments, perm: ['payments'], crumbs: ['Finance', 'Payments'] },
  { path: '/payouts', component: Payouts, perm: ['payments'], crumbs: ['Finance', 'Payouts & settlements'] },
  { path: '/products', component: Products, perm: ['products'], crumbs: ['Catalog', 'Products'] },
  {
    path: '/categories',
    component: Categories,
    perm: ['catalog', 'products'],
    crumbs: ['Catalog', 'Categories'],
  },
  {
    path: '/master-catalog',
    component: MasterCatalog,
    perm: ['catalog', 'products'],
    crumbs: ['Catalog', 'Master catalog'],
  },
  { path: '/inventory', component: Inventory, perm: ['inventory'], crumbs: ['Catalog', 'Inventory'] },
  { path: '/reports', component: Reports, perm: ['reports', 'inventory'], crumbs: ['Reports'] },
  { path: '/employees', component: Employees, perm: ['employees'], crumbs: ['Administration', 'Employees'] },
  { path: '/settings', component: Settings, perm: ['settings'], crumbs: ['Administration', 'Settings'] },
  { path: '/profile', component: Profile, perm: [], crumbs: ['My profile'] },
];

// The route for a URL plus its params, or null for an unknown page.
export function findRoute(pathname) {
  for (const route of ROUTES) {
    const params = matchPath(route.path, pathname);
    if (params) return { route, params };
  }
  return null;
}

export function buildCrumbs(route, params) {
  const crumbs = [{ label: 'Fauran Mart', to: '/' }];
  if (!route) return [...crumbs, { label: 'Not found' }];
  if (!route.crumbs.length) return [...crumbs, { label: 'Dashboard' }];

  route.crumbs.forEach((crumb) => {
    if (Array.isArray(crumb)) crumbs.push({ label: crumb[0], to: crumb[1] });
    else crumbs.push({ label: crumb === ':id' ? params.id : crumb });
  });
  return crumbs;
}

// First page (without params) the admin may open; used when they can't see the dashboard.
export const firstAllowedRoute = (can) =>
  ROUTES.find((r) => r.perm.length && can(r.perm) && !r.path.includes(':'));
