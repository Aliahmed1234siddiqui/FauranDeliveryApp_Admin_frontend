import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * Load data from a services/api call, cached by React Query (see lib/queryClient).
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
  useLayoutEffect(() => { fnRef.current = fn; });

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
  const setData = useCallback((next) => client.setQueryData(JSON.parse(keyHash), (old) => {
    if (typeof next !== 'function') return next;
    return old === undefined ? undefined : next(old);
  }), [client, keyHash]);

  return {
    data: query.data ?? null,
    loading: query.isPending || (query.isFetching && (query.isPlaceholderData || reloading)),
    error: query.error ?? null,
    reload,
    setData,
    updatedAt: query.dataUpdatedAt || null,
  };
}

// Run a mutation with a loading flag and toast feedback.
// A successful change refreshes what's on screen (sidebar badges, header counts) and marks
// every other cached query stale, so other pages refetch when they're opened.
export function useAction() {
  const client = useQueryClient();
  const [pending, setPending] = useState(false);
  const run = useCallback(async (fn, { success, error } = {}) => {
    setPending(true);
    try {
      const result = await fn();
      client.invalidateQueries();
      if (success) toast.success(success);
      return result;
    } catch (err) {
      toast.error(error || err.message || 'Something went wrong');
      throw err;
    } finally {
      setPending(false);
    }
  }, [client]);
  return [run, pending];
}

export function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useClickOutside(ref, onOutside, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onOutside(); };
    const key = (e) => e.key === 'Escape' && onOutside();
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', key); };
  }, [ref, onOutside, active]);
}
