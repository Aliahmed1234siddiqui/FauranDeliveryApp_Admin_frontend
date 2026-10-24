import { CalendarDays, Percent, Receipt, ShoppingBag } from 'lucide-react';

import { StatCard } from '@/components/ui';
import { paths, useRouter } from '@/router';
import { compactMoney, num } from '@/utils/format';

import { StatSkeletons } from './stat-skeletons';

// Headline numbers for today and this month.
export function TodayStats({ summary: s, failed }) {
  const { navigate } = useRouter();
  return (
    <div className="stat-grid">
      {s ? (
        <>
          <StatCard
            icon={ShoppingBag}
            label="Orders today"
            value={num(s.orders.today)}
            footer={`${num(s.revenue.today.orders)} delivered so far`}
            onClick={() => navigate(paths.orders())}
          />
          <StatCard
            icon={Receipt}
            tone="amber"
            label="Sales today"
            value={compactMoney(s.revenue.today.totalSales)}
            footer="Products + delivery, delivered orders"
          />
          <StatCard
            icon={Percent}
            tone="violet"
            label="Commission today"
            value={compactMoney(s.revenue.today.platformCommission)}
            footer={`${s.commissionPercent}% of product sales`}
          />
          <StatCard
            icon={CalendarDays}
            tone="blue"
            label="Sales this month"
            value={compactMoney(s.revenue.thisMonth.totalSales)}
            footer={`${num(s.revenue.thisMonth.orders)} orders · ${compactMoney(s.revenue.thisMonth.platformCommission)} commission`}
          />
        </>
      ) : (
        !failed && <StatSkeletons count={4} />
      )}
    </div>
  );
}
