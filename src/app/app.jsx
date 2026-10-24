import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/context';
import { RouterProvider } from '@/router';
import { queryClient } from '@/services/query-client';

import { AuthGate } from './auth-gate';

// React Query cache inspector (the floating TanStack button). Hidden by default; to use it while
// developing, set VITE_QUERY_DEVTOOLS=true in .env.local. Never included in production builds.
const SHOW_QUERY_DEVTOOLS = import.meta.env.DEV && import.meta.env.VITE_QUERY_DEVTOOLS === 'true';
const QueryDevtools = SHOW_QUERY_DEVTOOLS
  ? lazy(() => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })))
  : () => null;

const TOAST_OPTIONS = {
  className: 'toast',
  duration: 3500,
  success: { iconTheme: { primary: '#3f9b5c', secondary: '#fff' } },
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider>
        <AuthProvider>
          <AuthGate />
          <Toaster position="bottom-right" toastOptions={TOAST_OPTIONS} />
        </AuthProvider>
      </RouterProvider>
      <Suspense fallback={null}>
        <QueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </Suspense>
    </QueryClientProvider>
  );
}
