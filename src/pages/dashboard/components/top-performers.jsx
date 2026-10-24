import { paths, useRouter } from '@/router';
import { compactMoney } from '@/utils/format';

import { RankCard } from './rank-card';

// Top five vendors and riders side by side.
export function TopPerformers({ summary: s }) {
  const { navigate } = useRouter();
  return (
    <div className="grid grid-2 mb">
      <RankCard
        title="Top vendors"
        subtitle="Most delivered orders"
        rows={s.topVendors || []}
        toItem={(v) => ({
          key: v.vendorId,
          label: v.storeName || v.vendorName,
          value: v.totalOrders,
          meta: compactMoney(v.totalSales),
        })}
        onItemClick={(item) => navigate(paths.vendor(item.key))}
      />
      <RankCard
        title="Top riders"
        subtitle="Most deliveries"
        rows={s.topRiders || []}
        toItem={(r) => ({
          key: r.riderId,
          label: r.name,
          value: r.deliveries,
          meta: r.rating ? `★ ${r.rating}` : undefined,
        })}
        onItemClick={(item) => navigate(paths.rider(item.key))}
      />
    </div>
  );
}
