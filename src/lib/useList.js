import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useQueryState } from './router';
import { useApi, useDebounced } from './hooks';
import { PAGE_SIZE } from '../config';

// Fetchers are module-level api functions (vendorsApi.list…), so each gets one stable cache key.
const listKeys = new WeakMap();
let nextListId = 0;
const listKey = (fetcher) => {
  if (!listKeys.has(fetcher)) listKeys.set(fetcher, `list:${(nextListId += 1)}`);
  return listKeys.get(fetcher);
};

/**
 * Paged, filterable list kept in the URL (?search=&status=&page=) so filters
 * survive refresh and the back button.
 *
 *   const list = useList(vendorsApi.list, ['status', 'isActive']);
 *   list.rows, list.total, list.filters.status, list.setFilter('status', 'pending')
 *
 * `fetcher(params)` must resolve `{ items, total }` (what `http.page` returns).
 * Filter values of 'all' or '' are dropped before the request is sent.
 * `filterKeys` must be a constant array per page.
 */
export function useList(fetcher, filterKeys = [], { limit = PAGE_SIZE, defaults = {} } = {}) {
  const [search, setSearch] = useQueryState('search');
  const [page, setPage] = useQueryState('page', '1');
  const filters = {};
  const setters = {};
  filterKeys.forEach((key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- filterKeys is a constant per page
    const [value, set] = useQueryState(key, defaults[key] ?? 'all');
    filters[key] = value;
    setters[key] = set;
  });

  const debouncedSearch = useDebounced(search, 300);
  const params = { search: debouncedSearch, page: Number(page) || 1, limit, ...filters };
  const key = listKey(fetcher);
  const result = useApi(() => fetcher(params), [JSON.stringify(params)], { key });

  // Warm the next page so paging forward is instant.
  const client = useQueryClient();
  const hasNext = (result.data?.totalPages || 0) > params.page;
  const nextParams = JSON.stringify({ ...params, page: params.page + 1 });
  useEffect(() => {
    if (hasNext) client.prefetchQuery({ queryKey: [key, nextParams], queryFn: () => fetcher(JSON.parse(nextParams)) });
  }, [client, key, fetcher, hasNext, nextParams]);

  return {
    ...result,
    rows: result.data?.items,
    total: result.data?.total || 0,
    params,
    search,
    setSearch,
    page: params.page,
    setPage: (p) => setPage(String(p)),
    filters,
    setFilter: (key, value) => setters[key](value),
  };
}
