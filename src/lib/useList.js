import { useQueryState } from './router';
import { useApi, useDebounced } from './hooks';

// Paginated list backed by URL query params (?q=&status=&page=&sort=) so filters
// survive refresh and the back button. `filterKeys` must be a stable array.
export function useList(fetcher, filterKeys = [], { limit = 10, defaultSort = '' } = {}) {
  const [search, setSearch] = useQueryState('q');
  const [page, setPage] = useQueryState('page', '1');
  const [sort, setSort] = useQueryState('sort', defaultSort);
  const filters = {};
  const setters = {};
  filterKeys.forEach((key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- filterKeys is a constant per page
    const [value, set] = useQueryState(key, 'all');
    filters[key] = value;
    setters[key] = set;
  });
  const q = useDebounced(search, 250);
  const params = { search: q, page: Number(page), limit, sort, ...filters };
  const result = useApi(() => fetcher(params), [JSON.stringify(params)]);

  return {
    ...result,
    rows: result.data?.items,
    total: result.data?.total || 0,
    params,
    search,
    setSearch,
    page: Number(page),
    setPage: (p) => setPage(String(p)),
    sort,
    setSort,
    filters,
    setFilter: (key, value) => setters[key](value),
  };
}
