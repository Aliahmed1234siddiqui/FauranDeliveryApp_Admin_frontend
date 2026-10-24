import { Suspense, useCallback, useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

import { CommandPalette, Sidebar, Topbar } from '@/components/layout';
import { Button, Spinner } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi, useHotkey, useTheme } from '@/hooks';
import { ForbiddenPage } from '@/pages/errors/forbidden-page';
import { NotFoundPage } from '@/pages/errors/not-found-page';
import { paths, useRouter } from '@/router';
import { buildCrumbs, findRoute, firstAllowedRoute } from '@/router/routes';
import { dashboardApi } from '@/services/api';

// Pending-approval counts for the sidebar badges; refreshed when the section changes.
function useNavBadges() {
  const { pathname } = useRouter();
  const { can } = useAuth();
  const section = pathname.split('/')[1];
  const { data: summary } = useApi(
    () => (can('dashboard') ? dashboardApi.summary() : Promise.resolve(null)),
    [section],
    { key: 'nav-badges' },
  );
  return {
    vendors: summary?.users?.vendors?.pending,
    riders: summary?.users?.riders?.pending,
    products: summary?.inventory?.pendingApproval,
  };
}

function PreviewBanner() {
  const { previewAs, setPreviewAs } = useAuth();
  if (!previewAs) return null;
  return (
    <div className="preview-banner">
      <Eye size={16} /> Previewing the portal as <strong>{previewAs.name}</strong> (
      {previewAs.permissions.length} permissions). Pages they can&apos;t open are hidden.
      <Button size="sm" variant="secondary" onClick={() => setPreviewAs(null)}>
        Exit preview
      </Button>
    </div>
  );
}

// Signed-in layout: sidebar, top bar and the page for the current URL.
export function AppShell() {
  const { pathname, navigate } = useRouter();
  const { can } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const badges = useNavBadges();

  useHotkey('k', () => setPaletteOpen((open) => !open));

  // Landing on "/" without dashboard access: go to the first page the admin can open.
  useEffect(() => {
    if (pathname !== paths.dashboard() || can('dashboard')) return;
    const first = firstAllowedRoute(can);
    if (first) navigate(first.path, { replace: true });
  }, [pathname, can, navigate]);

  const match = findRoute(pathname);
  const Page = match?.route.component;
  const allowed = match && (!match.route.perm.length || can(match.route.perm));
  const closeNav = useCallback(() => setNavOpen(false), []);
  const openPalette = () => setPaletteOpen(true);

  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <Sidebar badges={badges} onNavigate={closeNav} onOpenSearch={openPalette} />
      {navOpen && <div className="nav-scrim" onClick={closeNav} />}
      <div className="main">
        <Topbar
          crumbs={buildCrumbs(match?.route, match?.params)}
          onMenu={() => setNavOpen(true)}
          onOpenSearch={openPalette}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <PreviewBanner />
        <main className="content" key={pathname}>
          <Suspense
            fallback={
              <div className="blank-state">
                <Spinner size={26} />
              </div>
            }
          >
            {!match ? <NotFoundPage /> : !allowed ? <ForbiddenPage /> : <Page params={match.params} />}
          </Suspense>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
