import { useAuth } from '@/context';
import { paths, useRouter } from '@/router';
import { num } from '@/utils/format';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

// Welcome banner with quick links to what needs attention right now.
export function DashboardHero({ summary: s }) {
  const { admin } = useAuth();
  const { navigate } = useRouter();
  const pendingApprovals = s ? s.users.vendors.pending + s.users.riders.pending : 0;

  return (
    <div className="hero">
      <div>
        <h1>
          {greeting()}, {admin?.name?.split(' ')[0]} 👋
        </h1>
        <p>
          Here&apos;s what&apos;s happening across Fauran Mart today,{' '}
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.
        </p>
      </div>
      {s && (
        <div className="hero-chips">
          <button type="button" className="hero-chip" onClick={() => navigate(paths.orders())}>
            <span className="live-dot" />
            <div>
              <strong>{num(s.orders.active)}</strong>
              <small>Active orders</small>
            </div>
          </button>
          <button
            type="button"
            className="hero-chip"
            onClick={() => navigate(paths.vendors({ status: 'pending' }))}
          >
            <div>
              <strong>{num(pendingApprovals)}</strong>
              <small>Awaiting approval</small>
            </div>
          </button>
          <button
            type="button"
            className="hero-chip"
            onClick={() => navigate(paths.orders({ status: 'delivery_failed' }))}
          >
            <div>
              <strong>{num(s.orders.failedDeliveries)}</strong>
              <small>Failed deliveries</small>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
