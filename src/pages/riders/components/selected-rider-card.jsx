import { ArrowRight, MapPinOff, Phone } from 'lucide-react';

import { Button, Card, Code, KeyValue, StatusBadge } from '@/components/ui';
import { Link, paths } from '@/router';
import { timeAgo, titleCase } from '@/utils/format';

import { hasGps, riderStatus } from '../live-map-utils';

export function SelectedRider({ rider: r, onProfile }) {
  const order = r.activeOrder;
  return (
    <Card
      title={r.name}
      subtitle={`${r.riderId} · ${titleCase(r.vehicleType || 'rider')}`}
      action={<StatusBadge status={riderStatus(r)} />}
    >
      <KeyValue
        items={[
          ['Phone', r.phone],
          ['Vehicle', r.vehicleNumber],
          ['Rating', r.rating || '—'],
          ['Last seen', timeAgo(r.lastSeen)],
        ]}
      />
      {!hasGps(r) && (
        <p className="muted row" style={{ gap: 6, marginTop: 12, fontSize: 13 }}>
          <MapPinOff size={14} /> Hasn&apos;t shared a location yet.
        </p>
      )}
      {order && (
        <div style={{ marginTop: 16 }}>
          <KeyValue
            columns={1}
            items={[
              [
                'Active order',
                <Link key="o" to={paths.order(order.orderId)}>
                  <Code>{order.orderId}</Code>
                </Link>,
              ],
              ['Order status', <StatusBadge key="s" status={order.status} />],
              ['Store', order.vendor?.storeName],
              ['Deliver to', order.deliveryAddress?.addressLine],
            ]}
          />
        </div>
      )}
      <div className="row" style={{ marginTop: 16 }}>
        {r.phone && (
          <Button
            variant="secondary"
            size="sm"
            icon={Phone}
            onClick={() => {
              window.location.href = `tel:${r.phone.replace(/\s/g, '')}`;
            }}
          >
            Call
          </Button>
        )}
        <Button variant="soft" size="sm" iconRight={ArrowRight} onClick={onProfile}>
          Full profile
        </Button>
      </div>
    </Card>
  );
}
