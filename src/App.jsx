import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Compass, Eye, Lock } from 'lucide-react';
import { RouterProvider, matchPath, useRouter } from './lib/router';
import { AuthProvider, useAuth } from './lib/auth';
import { useApi } from './lib/hooks';
import { queryClient } from './lib/queryClient';
import { dashboardApi } from './services/api';
import Sidebar from './layout/Sidebar';
import Topbar from './layout/Topbar';
import CommandPalette from './layout/CommandPalette';
import { Button, Spinner } from './ui/primitives';

import Login from './pages/Login';
// Each page is its own chunk, loaded the first time it is opened.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vendors = lazy(() => import('./pages/Vendors'));
const VendorDetail = lazy(() => import('./pages/VendorDetail'));
const Riders = lazy(() => import('./pages/Riders'));
const RiderDetail = lazy(() => import('./pages/RiderDetail'));
const LiveRiders = lazy(() => import('./pages/LiveRiders'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Payments = lazy(() => import('./pages/Payments'));
const Payouts = lazy(() => import('./pages/Payouts'));
const Products = lazy(() => import('./pages/Products'));
const Categories = lazy(() => import('./pages/Categories'));
const MasterCatalog = lazy(() => import('./pages/MasterCatalog'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Employees = lazy(() => import('./pages/Employees'));
const Profile = lazy(() => import('./pages/Profile'));
// React Query cache inspector (the floating TanStack button). Hidden by default; to use it while
// developing, set VITE_QUERY_DEVTOOLS=true in .env.local. Never included in production builds.
const QueryDevtools = import.meta.env.DEV && import.meta.env.VITE_QUERY_DEVTOOLS === 'true'
  ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
  : () => null;

// Order matters: static segments ("/riders/live") must come before params ("/riders/:id").
const ROUTES = [
  { path: '/', component: Dashboard, perm: ['dashboard'], crumbs: [] },
  { path: '/orders', component: Orders, perm: ['orders'], crumbs: ['Orders'] },
  { path: '/orders/:id', component: OrderDetail, perm: ['orders'], crumbs: [['Orders', '/orders'], ':id'] },
  { path: '/vendors', component: Vendors, perm: ['vendors'], crumbs: ['Vendors'] },
  { path: '/vendors/:id', component: VendorDetail, perm: ['vendors'], crumbs: [['Vendors', '/vendors'], ':id'] },
  { path: '/riders', component: Riders, perm: ['riders'], crumbs: ['Riders'] },
  { path: '/riders/live', component: LiveRiders, perm: ['riders'], crumbs: [['Riders', '/riders'], 'Live map'] },
  { path: '/riders/:id', component: RiderDetail, perm: ['riders'], crumbs: [['Riders', '/riders'], ':id'] },
  { path: '/customers', component: Customers, perm: ['customers'], crumbs: ['Customers'] },
  { path: '/customers/:id', component: CustomerDetail, perm: ['customers'], crumbs: [['Customers', '/customers'], ':id'] },
  { path: '/payments', component: Payments, perm: ['payments'], crumbs: ['Finance', 'Payments'] },
  { path: '/payouts', component: Payouts, perm: ['payments'], crumbs: ['Finance', 'Payouts & settlements'] },
  { path: '/products', component: Products, perm: ['products'], crumbs: ['Catalog', 'Products'] },
  { path: '/categories', component: Categories, perm: ['catalog', 'products'], crumbs: ['Catalog', 'Categories'] },
  { path: '/master-catalog', component: MasterCatalog, perm: ['catalog', 'products'], crumbs: ['Catalog', 'Master catalog'] },
  { path: '/inventory', component: Inventory, perm: ['inventory'], crumbs: ['Catalog', 'Inventory'] },
  { path: '/reports', component: Reports, perm: ['reports'], crumbs: ['Reports'] },
  { path: '/employees', component: Employees, perm: ['employees'], crumbs: ['Administration', 'Employees'] },
  { path: '/settings', component: Settings, perm: ['settings'], crumbs: ['Administration', 'Settings'] },
  { path: '/profile', component: Profile, perm: [], crumbs: ['My profile'] },
];

function resolve(pathname) {
  for (const route of ROUTES) {
    const params = matchPath(route.path, pathname);
    if (params) return { route, params };
  }
  return null;
}

function buildCrumbs(route, params) {
  const list = [{ label: 'Fauran Mart', to: '/' }];
  if (!route) return [...list, { label: 'Not found' }];
  if (!route.crumbs.length) return [...list, { label: 'Dashboard' }];
  route.crumbs.forEach((c) => {
    if (Array.isArray(c)) list.push({ label: c[0], to: c[1] });
    else list.push({ label: c === ':id' ? params.id : c });
  });
  return list;
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem('fauran_theme');
    if (saved) return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Forbidden() {
  const { navigate } = useRouter();
  return (
    <div className="blank-state">
      <div>
        <span className="big-icon tone-warning"><Lock size={30} /></span>
        <h1>You don&apos;t have access to this page</h1>
        <p>Your account doesn&apos;t include the permission this page needs. Ask a super admin to update your access under Employees.</p>
        <Button variant="secondary" onClick={() => navigate('/profile')}>See my permissions</Button>
      </div>
    </div>
  );
}

function NotFound() {
  const { navigate } = useRouter();
  return (
    <div className="blank-state">
      <div>
        <span className="big-icon tone-brand"><Compass size={30} /></span>
        <h1>Page not found</h1>
        <p>The link may be broken or the page may have moved.</p>
        <Button onClick={() => navigate('/')}>Back to dashboard</Button>
      </div>
    </div>
  );
}

function Shell() {
  const { pathname, navigate } = useRouter();
  const { can, previewAs, setPreviewAs } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('fauran_theme', theme); } catch { /* storage blocked */ }
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((o) => !o); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Pending-approval counts for the sidebar badges; refreshed when the section changes.
  const { data: summary } = useApi(() => (can('dashboard') ? dashboardApi.summary() : Promise.resolve(null)), [pathname.split('/')[1]], { key: 'nav-badges' });
  const badges = {
    vendors: summary?.users?.vendors?.pending,
    riders: summary?.users?.riders?.pending,
    products: summary?.inventory?.pendingApproval,
  };

  const match = resolve(pathname);
  // Landing on "/" without dashboard access: go to the first page the user can open.
  useEffect(() => {
    if (pathname === '/' && !can('dashboard')) {
      const first = ROUTES.find((r) => r.perm.length && can(r.perm) && !r.path.includes(':'));
      if (first) navigate(first.path, { replace: true });
    }
  }, [pathname, can, navigate]);

  const Page = match?.route.component;
  const allowed = match && (!match.route.perm.length || can(match.route.perm));
  const closeNav = useCallback(() => setNavOpen(false), []);

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <Sidebar badges={badges} onNavigate={closeNav} onOpenSearch={() => setPaletteOpen(true)} />
      {navOpen && <div className="nav-scrim" onClick={closeNav} />}
      <div className="main">
        <Topbar crumbs={buildCrumbs(match?.route, match?.params)} onMenu={() => setNavOpen(true)} onOpenSearch={() => setPaletteOpen(true)} theme={theme} onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} />
        {previewAs && (
          <div className="preview-banner">
            <Eye size={16} /> Previewing the portal as <strong>{previewAs.name}</strong> ({previewAs.permissions.length} permissions). Pages they can&apos;t open are hidden.
            <Button size="sm" variant="secondary" onClick={() => setPreviewAs(null)}>Exit preview</Button>
          </div>
        )}
        <main className="content" key={pathname}>
          <Suspense fallback={<div className="blank-state"><Spinner size={26} /></div>}>
            {!match ? <NotFound /> : !allowed ? <Forbidden /> : <Page params={match.params} />}
          </Suspense>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function Gate() {
  const { admin, loading } = useAuth();
  const { pathname, navigate } = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!admin && pathname !== '/login') navigate(`/login${pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''}`, { replace: true });
    if (admin && pathname === '/login') navigate(new URLSearchParams(window.location.search).get('next') || '/', { replace: true });
  }, [admin, loading, pathname, navigate]);

  if (loading) return <div className="blank-state" style={{ minHeight: '100vh' }}><Spinner size={28} /></div>;
  if (!admin) return <Login />;
  return <Shell />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider>
        <AuthProvider>
          <Gate />
          <Toaster position="bottom-right" toastOptions={{ className: 'toast', duration: 3500, success: { iconTheme: { primary: '#3f9b5c', secondary: '#fff' } } }} />
        </AuthProvider>
      </RouterProvider>
      <Suspense fallback={null}><QueryDevtools initialIsOpen={false} buttonPosition="bottom-left" /></Suspense>
    </QueryClientProvider>
  );
}
