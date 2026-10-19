import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

// Load data from a services/api call. Re-runs when `deps` change; `reload()` re-fetches.
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  useLayoutEffect(() => { fnRef.current = fn; });

  useEffect(() => {
    let cancelled = false;
    // Keep the previous data on screen while re-fetching (tables dim instead of blanking).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- flag the request as in-flight
    setState((s) => (s.loading ? s : { ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => !cancelled && setState({ data, loading: false, error: null }))
      .catch((error) => !cancelled && setState((s) => ({ data: s.data, loading: false, error })));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload, setData: (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })) };
}

// Run a mutation with a loading flag and toast feedback.
export function useAction() {
  const [pending, setPending] = useState(false);
  const run = useCallback(async (fn, { success, error } = {}) => {
    setPending(true);
    try {
      const result = await fn();
      if (success) toast.success(success);
      return result;
    } catch (err) {
      toast.error(error || err.message || 'Something went wrong');
      throw err;
    } finally {
      setPending(false);
    }
  }, []);
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
