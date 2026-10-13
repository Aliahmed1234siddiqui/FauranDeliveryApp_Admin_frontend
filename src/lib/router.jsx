/* eslint-disable react-refresh/only-export-components -- router module: provider, hooks and Link */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Minimal history-API router: enough for path params and query strings
// without pulling in a routing library.
const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, search: window.location.search }));

  useEffect(() => {
    const onPop = () => setLocation({ pathname: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    const url = new URL(to, window.location.origin);
    if (url.pathname + url.search === window.location.pathname + window.location.search) return;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.pathname + url.search);
    setLocation({ pathname: url.pathname, search: url.search });
    if (!replace) window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo(() => ({ ...location, navigate }), [location, navigate]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export const useRouter = () => useContext(RouterContext);

export function matchPath(pattern, pathname) {
  const p = pattern.split('/').filter(Boolean);
  const s = pathname.split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i += 1) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

// Query-string state: keeps filters in the URL so they survive refresh/back.
export function useQueryState(key, fallback = '') {
  const { search, pathname, navigate } = useRouter();
  const value = new URLSearchParams(search).get(key) ?? fallback;
  const setValue = useCallback((next) => {
    const params = new URLSearchParams(window.location.search);
    if (next === fallback || next === '' || next == null) params.delete(key);
    else params.set(key, next);
    if (key !== 'page') params.delete('page');
    const qs = params.toString();
    navigate(`${pathname}${qs ? `?${qs}` : ''}`, { replace: true });
  }, [key, fallback, pathname, navigate]);
  return [value, setValue];
}

export function Link({ to, children, className, onClick, ...rest }) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.(e);
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
