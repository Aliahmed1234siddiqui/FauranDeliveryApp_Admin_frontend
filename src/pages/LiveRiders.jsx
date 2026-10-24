import { useEffect, useState } from 'react';
import { ArrowRight, Bike, MapPinOff, Pause, Phone, Play, RefreshCw } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { Link, useQueryState, useRouter } from '../lib/router';
import { ridersApi } from '../services/api';
import { useSocketEvent } from '../services/socket';
import { timeAgo, titleCase } from '../lib/format';
import { Avatar, Button, Card, Code, EmptyState, ErrorState, KeyValue, PageHeader, SearchInput, Segmented, StatusBadge } from '../ui/primitives';

// The deployed backend can't hold Socket.IO connections, so socket events may
// never arrive. We still listen for them, and also re-fetch the list on a timer.
const POLL_MS = 15000;

// A rider that never shared GPS comes back at { lat: 0, lng: 0 }.
const hasGps = (r) => Boolean(r.location?.lat || r.location?.lng);
const riderStatus = (r) => (r.isAvailable ? 'available' : 'busy');
const PIN_CLASS = { busy: 'is-delivering', available: 'is-idle' };

/**
 * Project real lat/lng onto the stylised CSS map (percent left/top).
 * Take the bounding box of the pinned riders, enforce a minimum size so one
 * rider (or a tight cluster) doesn't zoom in absurdly, then map it into the
 * 10%-90% band so pins never sit on the edge. Axes are scaled independently -
 * good enough for "who is where", not a real map projection.
 */
const MIN_SPAN = 0.02; // degrees, roughly 2 km
function makeProjection(points) {
  if (!points.length) return () => ({ left: 50, top: 50 });
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const span = (min, max) => {
    const pad = Math.max(max - min, MIN_SPAN) / 2;
    const mid = (min + max) / 2;
    return [mid - pad, mid + pad];
  };
  const [south, north] = span(Math.min(...lats), Math.max(...lats));
  const [west, east] = span(Math.min(...lngs), Math.max(...lngs));
  return ({ lat, lng }) => ({
    left: 10 + ((lng - west) / (east - west)) * 80,
    top: 10 + ((north - lat) / (north - south)) * 80, // north is up
  });
}

export default function LiveRiders() {
  const { navigate } = useRouter();
  const [selected, setSelected] = useQueryState('rider');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [paused, setPaused] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const { data, loading, error, reload, setData } = useApi(() => ridersApi.live().then((rows) => { setUpdatedAt(Date.now()); return rows; }), [], { key: 'live-riders', staleTime: 0 });

  // Polling fallback for when the socket is unavailable.
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [paused, reload]);

  // Live position pushes. Riders not in the list yet arrive via rider:status / the next poll.
  useSocketEvent('rider:live_location', ({ riderId, lat, lng, isAvailable }) => {
    if (paused) return;
    setData((rows) => rows?.map((r) => (r._id === riderId ? { ...r, location: { lat, lng }, isAvailable, lastSeen: new Date().toISOString() } : r)));
    setUpdatedAt(Date.now());
  });

  // Coming online needs the full row (activeOrder etc.), so re-fetch; going offline just drops the rider.
  useSocketEvent('rider:status', ({ riderId, isOnline }) => {
    if (isOnline) reload();
    else setData((rows) => rows?.filter((r) => r._id !== riderId));
  });

  const riders = data || [];
  const q = search.trim().toLowerCase();
  const shown = riders.filter((r) => (filter === 'all' || riderStatus(r) === filter)
    && [r.name, r.riderId, r.vehicleNumber].some((s) => s?.toLowerCase().includes(q)));
  const pinned = shown.filter(hasGps);
  const project = makeProjection(pinned.map((r) => r.location));
  const active = riders.find((r) => r._id === selected);
  const count = (s) => riders.filter((r) => riderStatus(r) === s).length;

  return (
    <>
      <PageHeader
        title="Live rider map"
        description="Where every online rider is right now. Positions update live and refresh every 15 seconds."
        actions={(
          <>
            <Button variant="secondary" icon={paused ? Play : Pause} onClick={() => setPaused((p) => !p)}>{paused ? 'Resume updates' : 'Pause updates'}</Button>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>Refresh</Button>
          </>
        )}
      />
      {error && !data ? <Card><ErrorState error={error} onRetry={reload} /></Card> : (
        <div className="grid grid-side">
          <div className="map" role="img" aria-label="Rider positions">
            <div className="map-grid" />
            <div className="map-road" style={{ left: 0, right: 0, top: '48%', height: 14 }} />
            <div className="map-road" style={{ top: 0, bottom: 0, left: '56%', width: 14 }} />
            <div className="map-road" style={{ left: '10%', right: '30%', top: '22%', height: 8, transform: 'rotate(12deg)' }} />
            {pinned.map((r) => {
              const { left, top } = project(r.location);
              return (
                <button
                  type="button"
                  key={r._id}
                  className={`map-pin ${PIN_CLASS[riderStatus(r)]} ${selected === r._id ? 'is-selected' : ''}`}
                  style={{ left: `${left}%`, top: `${top}%` }}
                  onClick={() => setSelected(r._id)}
                  aria-label={r.name}
                >
                  <span className="map-pin-dot"><Bike size={14} /></span>
                  {(selected === r._id || pinned.length < 8) && <span className="map-pin-label">{r.name.split(' ')[0]}</span>}
                </button>
              );
            })}
            <div className="map-legend">
              <span><i style={{ background: 'var(--brand)' }} />On delivery</span>
              <span><i style={{ background: 'var(--info)' }} />Available</span>
            </div>
            <div className="map-updated">
              {paused ? <Pause size={13} /> : <span className="live-dot" />}
              {paused ? 'Paused' : updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Loading…'}
            </div>
          </div>

          <div className="stack">
            {active && <SelectedRider rider={active} onProfile={() => navigate(`/riders/${active.riderId}`)} />}
            <Card padded={false} className="card-flush">
              <div className="toolbar toolbar-stack">
                <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: riders.length }, { value: 'busy', label: 'Busy', count: count('busy') }, { value: 'available', label: 'Available', count: count('available') }]} />
                <SearchInput value={search} onChange={setSearch} placeholder="Find a rider" />
              </div>
              <div className="rider-list">
                {!loading && riders.length === 0 && <EmptyState icon={Bike} title="No riders online" description="Riders appear here as soon as they go online in the rider app." />}
                {riders.length > 0 && shown.length === 0 && <EmptyState icon={Bike} title="No riders match" />}
                {shown.map((r) => (
                  <button type="button" key={r._id} className={`rider-row ${selected === r._id ? 'is-selected' : ''}`} onClick={() => setSelected(r._id)}>
                    <Avatar name={r.name} size="sm" />
                    <div className="identity-copy" style={{ flex: 1 }}>
                      <strong>{r.name}</strong>
                      <small>{r.vehicleNumber || r.riderId}{hasGps(r) ? '' : ' · No GPS yet'}</small>
                    </div>
                    <StatusBadge status={riderStatus(r)} />
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function SelectedRider({ rider: r, onProfile }) {
  const order = r.activeOrder;
  return (
    <Card title={r.name} subtitle={`${r.riderId} · ${titleCase(r.vehicleType || 'rider')}`} action={<StatusBadge status={riderStatus(r)} />}>
      <KeyValue items={[
        ['Phone', r.phone],
        ['Vehicle', r.vehicleNumber],
        ['Rating', r.rating || '—'],
        ['Last seen', timeAgo(r.lastSeen)],
      ]} />
      {!hasGps(r) && <p className="muted row" style={{ gap: 6, marginTop: 12, fontSize: 13 }}><MapPinOff size={14} /> Hasn&apos;t shared a location yet.</p>}
      {order && (
        <div style={{ marginTop: 16 }}>
          <KeyValue columns={1} items={[
            ['Active order', <Link key="o" to={`/orders/${order.orderId}`}><Code>{order.orderId}</Code></Link>],
            ['Order status', <StatusBadge key="s" status={order.status} />],
            ['Store', order.vendor?.storeName],
            ['Deliver to', order.deliveryAddress?.addressLine],
          ]} />
        </div>
      )}
      <div className="row" style={{ marginTop: 16 }}>
        {r.phone && <Button variant="secondary" size="sm" icon={Phone} onClick={() => { window.location.href = `tel:${r.phone.replace(/\s/g, '')}`; }}>Call</Button>}
        <Button variant="soft" size="sm" iconRight={ArrowRight} onClick={onProfile}>Full profile</Button>
      </div>
    </Card>
  );
}
