import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Load data from a services/api call, cached by React Query (see services/query-client.js).
 *
 *   const { data, loading, error, reload, setData } = useApi(() => ordersApi.get(id), [id], { key: 'order' });
 *
 * The cache entry is `[key, ...deps]`, so `deps` must hold everything the call depends on.
 * Call sites that share a key share the data (a second mount is instant, no duplicate request).
 * Without a key the result is cached for that component instance only.
 * `loading` is true for the first load, a dep change and `reload()`, but not for
 * silent background refreshes, so tables only dim when the admin asked for new data.
 * Extra React Query options (staleTime, refetchInterval, enabled…) pass through.
 */
export function useApi(fn, deps = [], { key, ...options } = {}) {
  const instanceKey = useId();
  const queryKey = [key || `local:${instanceKey}`, ...deps];
  const fnRef = useRef(fn);
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  const client = useQueryClient();
  const query = useQuery({
    queryKey,
    queryFn: () => fnRef.current(),
    // Keep the previous data on screen while re-fetching (tables dim instead of blanking).
    placeholderData: keepPreviousData,
    ...options,
  });

  const [reloading, setReloading] = useState(false);
  const { refetch } = query;
  const reload = useCallback(() => {
    setReloading(true);
    return refetch().finally(() => setReloading(false));
  }, [refetch]);

  const keyHash = JSON.stringify(queryKey);
  const setData = useCallback(
    (next) =>
      client.setQueryData(JSON.parse(keyHash), (old) => {
        if (typeof next !== 'function') return next;
        return old === undefined ? undefined : next(old);
      }),
    [client, keyHash],
  );

  return {
    data: query.data ?? null,
    loading: query.isPending || (query.isFetching && (query.isPlaceholderData || reloading)),
    error: query.error ?? null,
    reload,
    setData,
    updatedAt: query.dataUpdatedAt || null,
  };
}
