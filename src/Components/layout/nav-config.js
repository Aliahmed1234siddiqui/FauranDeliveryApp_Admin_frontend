import {
  Banknote,
  Bike,
  Boxes,
  ChartColumnBig,
  CreditCard,
  LayoutDashboard,
  LibraryBig,
  MapPinned,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  Users,
} from 'lucide-react';

import { paths } from '@/router';

// `perm` lists the permission keys that unlock the page - same keys the backend's
// `can(...)` middleware checks, so the sidebar never shows a page that would 403.
export const NAV = [
  {
    label: 'Overview',
    items: [{ to: paths.dashboard(), label: 'Dashboard', icon: LayoutDashboard, perm: ['dashboard'] }],
  },
  {
    label: 'Operations',
    items: [
      { to: paths.orders(), label: 'Orders', icon: ShoppingBag, perm: ['orders'] },
      { to: paths.vendors(), label: 'Vendors', icon: Store, perm: ['vendors'], badge: 'vendors' },
      { to: paths.riders(), label: 'Riders', icon: Bike, perm: ['riders'], badge: 'riders' },
      { to: paths.liveRiders(), label: 'Live rider map', icon: MapPinned, perm: ['riders'], live: true },
      { to: paths.customers(), label: 'Customers', icon: Users, perm: ['customers'] },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { to: paths.products(), label: 'Products', icon: Package, perm: ['products'], badge: 'products' },
      { to: paths.categories(), label: 'Categories', icon: Tags, perm: ['catalog', 'products'] },
      { to: paths.masterCatalog(), label: 'Master catalog', icon: LibraryBig, perm: ['catalog', 'products'] },
      { to: paths.inventory(), label: 'Inventory', icon: Boxes, perm: ['inventory'] },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: paths.payments(), label: 'Payments', icon: CreditCard, perm: ['payments'] },
      { to: paths.payouts(), label: 'Payouts & settlements', icon: Banknote, perm: ['payments'] },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: paths.reports(), label: 'Reports', icon: ChartColumnBig, perm: ['reports', 'inventory'] }],
  },
  {
    label: 'Administration',
    items: [
      { to: paths.employees(), label: 'Employees', icon: ShieldCheck, perm: ['employees'] },
      { to: paths.settings(), label: 'Settings', icon: Settings, perm: ['settings'] },
    ],
  },
];

export const NAV_ITEMS = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.label })));

export function isActivePath(to, pathname) {
  if (to === '/') return pathname === '/';
  if (to === '/riders')
    return pathname === '/riders' || (pathname.startsWith('/riders/') && pathname !== '/riders/live');
  return pathname === to || pathname.startsWith(`${to}/`);
}
