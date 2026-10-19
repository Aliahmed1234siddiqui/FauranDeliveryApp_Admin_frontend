import { Banknote, Bike, Boxes, ChartColumnBig, CreditCard, LayoutDashboard, LibraryBig, MapPinned, Package, Settings, ShieldCheck, ShoppingBag, Store, Tags, Users } from 'lucide-react';

// `perm` lists the permission keys that unlock the page - same keys the backend's
// `can(...)` middleware checks, so the sidebar never shows a page that would 403.
export const NAV = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, perm: ['dashboard'] }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/orders', label: 'Orders', icon: ShoppingBag, perm: ['orders'] },
      { to: '/vendors', label: 'Vendors', icon: Store, perm: ['vendors'], badge: 'vendors' },
      { to: '/riders', label: 'Riders', icon: Bike, perm: ['riders'], badge: 'riders' },
      { to: '/riders/live', label: 'Live rider map', icon: MapPinned, perm: ['riders'], live: true },
      { to: '/customers', label: 'Customers', icon: Users, perm: ['customers'] },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/products', label: 'Products', icon: Package, perm: ['products'], badge: 'products' },
      { to: '/categories', label: 'Categories', icon: Tags, perm: ['catalog', 'products'] },
      { to: '/master-catalog', label: 'Master catalog', icon: LibraryBig, perm: ['catalog', 'products'] },
      { to: '/inventory', label: 'Inventory', icon: Boxes, perm: ['inventory'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/payments', label: 'Payments', icon: CreditCard, perm: ['payments'] },
      { to: '/payouts', label: 'Payouts & settlements', icon: Banknote, perm: ['payments'] },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/reports', label: 'Reports', icon: ChartColumnBig, perm: ['reports', 'inventory'] }],
  },
  {
    label: 'Administration',
    items: [
      { to: '/employees', label: 'Employees', icon: ShieldCheck, perm: ['employees'] },
      { to: '/settings', label: 'Settings', icon: Settings, perm: ['settings'] },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));

export function isActivePath(to, pathname) {
  if (to === '/') return pathname === '/';
  if (to === '/riders') return pathname === '/riders' || (pathname.startsWith('/riders/') && pathname !== '/riders/live');
  return pathname === to || pathname.startsWith(`${to}/`);
}
