import { useCallback } from 'react';

import { useRouter } from './use-router';

// Query-string state: keeps filters in the URL so they survive refresh/back.
// Changing any key other than `page` sends the list back to page 1.
export function useQueryState(key, fallback = '') {
  const { search, pathname, navigate } = useRouter();
  const value = new URLSearchParams(search).get(key) ?? fallback;

  const setValue = useCallback(
    (next) => {
      const params = new URLSearchParams(window.location.search);
      if (next === fallback || next === '' || next == null) params.delete(key);
      else params.set(key, next);
      if (key !== 'page') params.delete('page');
      const qs = params.toString();
      navigate(`${pathname}${qs ? `?${qs}` : ''}`, { replace: true });
    },
    [key, fallback, pathname, navigate],
  );

  return [value, setValue];
}
