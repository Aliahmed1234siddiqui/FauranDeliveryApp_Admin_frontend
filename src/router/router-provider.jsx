import { useCallback, useEffect, useMemo, useState } from 'react';

import { RouterContext } from './router-context';

const readLocation = () => ({ pathname: window.location.pathname, search: window.location.search });

// Minimal history-API router: enough for path params and query strings
// without pulling in a routing library.
export function RouterProvider({ children }) {
  const [location, setLocation] = useState(readLocation);

  useEffect(() => {
    const onPop = () => setLocation(readLocation());
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
