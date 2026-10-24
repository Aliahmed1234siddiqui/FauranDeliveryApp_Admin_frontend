import { Bike, Phone } from 'lucide-react';

import { Button, Card, Identity, KeyValue } from '@/components/ui';
import { useAuth } from '@/context';
import { useRouter } from '@/router';

export function PartiesCards({ order: o }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const profile = (perm, to) =>
    can(perm) && (
      <Button size="sm" variant="ghost" onClick={() => navigate(to)}>
        Profile
      </Button>
    );
  const { customer, vendor, rider } = o;
  return (
    <>
      <Card
        title="Customer"
        action={customer && profile('customers', `/customers/${customer.customerId || customer._id}`)}
      >
        <Identity name={customer?.name} sub={customer?.customerId} />
        <div style={{ marginTop: 14 }}>
          <KeyValue
            columns={1}
            items={[
              [
                'Phone',
                <span key="p" className="row" style={{ gap: 6 }}>
                  <Phone size={13} className="muted" />
                  {customer?.phone}
                </span>,
              ],
              customer?.email && ['Email', customer.email],
            ]}
          />
        </div>
      </Card>
      <Card title="Store" action={vendor && profile('vendors', `/vendors/${vendor.vendorId}`)}>
        <Identity
          name={vendor?.storeName}
          sub={[vendor?.vendorId, vendor?.name].filter(Boolean).join(' · ')}
          square
        />
        {(vendor?.phone || vendor?.storeAddress?.address) && (
          <div style={{ marginTop: 14 }}>
            <KeyValue
              columns={1}
              items={[
                vendor.phone && ['Phone', vendor.phone],
                vendor.storeAddress?.address && ['Address', vendor.storeAddress.address],
              ]}
            />
          </div>
        )}
      </Card>
      <Card title="Rider" action={rider && profile('riders', `/riders/${rider.riderId}`)}>
        {rider ? (
          <Identity
            name={rider.name}
            sub={[rider.riderId, rider.phone, rider.vehicleNumber].filter(Boolean).join(' · ')}
          />
        ) : (
          <div className="row muted">
            <Bike size={16} /> No rider assigned yet
          </div>
        )}
      </Card>
    </>
  );
}
