import { Bike, PackageX, Store, Users } from 'lucide-react';

import { StatCard } from '@/components/ui';
import { paths, useRouter } from '@/router';
import { num } from '@/utils/format';

// All-time marketplace size: vendors, riders, customers and stock health.
export function PlatformStats({ summary: s }) {
  const { navigate } = useRouter();
  return (
    <div className="stat-grid" style={{ marginTop: 18 }}>
      <StatCard
        icon={Store}
        tone="brand"
        label="Approved vendors"
        value={num(s.users.vendors.approved)}
        footer={`${num(s.users.vendors.total)} registered`}
        onClick={() => navigate(paths.vendors())}
      />
      <StatCard
        icon={Bike}
        tone="violet"
        label="Riders online now"
        value={`${num(s.users.riders.online)} / ${num(s.users.riders.approved)}`}
        footer={
          <>
            <span className="live-dot" /> Live on the map
          </>
        }
        onClick={() => navigate(paths.liveRiders())}
      />
      <StatCard
        icon={Users}
        tone="blue"
        label="Customers"
        value={num(s.users.customers)}
        footer={`+${num(s.users.newCustomersThisMonth)} this month`}
        onClick={() => navigate(paths.customers())}
      />
      <StatCard
        icon={PackageX}
        tone="rose"
        label="Low stock"
        value={num(s.inventory.lowStock)}
        footer={`${num(s.inventory.outOfStock)} out of stock · ${num(s.inventory.totalProducts)} products`}
        onClick={() => navigate(paths.inventory())}
      />
    </div>
  );
}
