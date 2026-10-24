import { QueryClient } from '@tanstack/react-query';

// One cache for the whole portal. Pages read it through useApi / useList (lib/hooks).
//
// - Data stays fresh for 30s, so moving between pages and back is instant.
// - Stale data is shown straight away and refreshed in the background.
// - Network and 5xx errors retry twice; 4xx errors (validation, 403, 404) never retry.
// - Switching back to the tab refreshes whatever is on screen.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (count, error) => !(error?.status >= 400 && error?.status < 500) && count < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
  },
});
