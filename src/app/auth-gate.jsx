import { useEffect } from 'react';

import { Spinner } from '@/components/ui';
import { useAuth } from '@/context';
import LoginPage from '@/pages/auth/login-page';
import { paths, useRouter } from '@/router';

import { AppShell } from './app-shell';

const LOGIN_PATH = paths.login();

// Shows the login page until an admin is signed in, keeping the URL in sync:
// signed out -> /login?next=<where they were>, signed in on /login -> back to `next`.
export function AuthGate() {
  const { admin, loading } = useAuth();
  const { pathname, navigate } = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!admin && pathname !== LOGIN_PATH) {
      const next = pathname !== paths.dashboard() ? pathname : undefined;
      navigate(paths.login({ next }), { replace: true });
    }
    if (admin && pathname === LOGIN_PATH) {
      navigate(new URLSearchParams(window.location.search).get('next') || paths.dashboard(), {
        replace: true,
      });
    }
  }, [admin, loading, pathname, navigate]);

  if (loading) {
    return (
      <div className="blank-state" style={{ minHeight: '100vh' }}>
        <Spinner size={28} />
      </div>
    );
  }
  return admin ? <AppShell /> : <LoginPage />;
}
