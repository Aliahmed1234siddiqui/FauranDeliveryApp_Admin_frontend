import { useApi } from '@/hooks';
import { productsApi } from '@/services/api';

// Header counts: one tiny page per filter, reading only `total`.
export function useCounts() {
  return useApi(
    async () => {
      const count = (params) => productsApi.list({ ...params, limit: 1 }).then((r) => r.total);
      const [all, pending, low, out] = await Promise.all([
        count({}),
        count({ approval: 'pending' }),
        count({ stock: 'low' }),
        count({ stock: 'out' }),
      ]);
      return { all, pending, low, out };
    },
    [],
    { key: 'product-counts' },
  );
}
