import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bike, Maximize2, MapPinOff, Pause, Phone, Play, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useApi } from '../lib/hooks';
import { Link, useQueryState, useRouter } from '../lib/router';
import { ridersApi } from '../services/api';
import { useSocketEvent } from '../services/socket';
import { time, timeAgo, titleCase } from '../lib/format';
import { Avatar, Button, Card, Code, EmptyState, ErrorState, KeyValue, PageHeader, SearchInput, Segmented, StatusBadge } from '../ui/primitives';

// The deployed backend can't hold Socket.IO connections, so socket events may
// never arrive. We still listen for them, and also re-fetch the list on a timer.
const POLL_MS = 15000;

// A rider that never shared GPS comes back at { lat: 0, lng: 0 }.
const hasGps = (r) => Boolean(r.location?.lat || r.location?.lng);
const riderStatus = (r) => (r.isAvailable ? 'available' : 'busy');
const PIN_CLASS = { busy: 'is-delivering', available: 'is-idle' };

// Map opens on Karachi until the first riders load, then fits to them.
const DEFAULT_CENTER = [24.8607, 67.0011];
const DEFAULT_ZOOM = 12;
const FOCUS_ZOOM = 16;
const FIT_OPTS = { padding: [60, 60], maxZoom: FOCUS_ZOOM - 1 };

// Lucide "bike" as a raw string - Leaflet divIcons take HTML, not React nodes.
const BIKE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>';
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function riderIcon(status, isSelected, label) {
  return L.divIcon({
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    html: `<div class="map-pin ${PIN_CLASS[status]} ${isSelected ? 'is-selected' : ''}"><span class="map-pin-dot">${BIKE_SVG}</span>${label ? `<span class="map-pin-label">${escapeHtml(label)}</span>` : ''}</div>`,
  });
}

function RiderMarker({ rider: r, isSelected, showLabel, onSelect }) {
  const status = riderStatus(r);
  const label = showLabel ? r.name.split(' ')[0] : '';
  // Memoised so position pushes only move the marker instead of rebuilding its icon.
  const icon = useMemo(() => riderIcon(status, isSelected, label), [status, isSelected, label]);
  return (
    <Marker
      position={[r.location.lat, r.location.lng]}
      icon={icon}
      title={r.name}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(r.riderId) }}
    />
  );
}

const boundsOf = (riders) => L.latLngBounds(riders.map((r) => [r.location.lat, r.location.lng]));

/** Fits the view to all riders once, on the first load that has any GPS pins. */
function FitOnFirstLoad({ riders }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !riders.length) return;
    done.current = true;
    map.fitBounds(boundsOf(riders), FIT_OPTS);
  }, [map, riders]);
  return null;
}

/** Flies to the selected rider when the selection changes (list click, map click, deep link). */
function FlyToSelected({ rider }) {
  const map = useMap();
  const id = rider && hasGps(rider) ? rider._id : null;
  const target = useRef(null);
  useLayoutEffect(() => { target.current = rider?.location; });
  useEffect(() => {
    if (!id) return;
    const { lat, lng } = target.current;
    map.flyTo([lat, lng], Math.max(map.getZoom(), FOCUS_ZOOM), { duration: 0.8 });
  }, [map, id]); // not on every position push, or the map would keep yanking around
  return null;
}

function FitAllButton({ riders }) {
  const map = useMap();
  if (!riders.length) return null;
  return (
    <button type="button" className="map-fit" onClick={() => map.flyToBounds(boundsOf(riders), { ...FIT_OPTS, duration: 0.8 })}>
      <Maximize2 size={13} /> Show all riders
    </button>
  );
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
  // `?rider=` holds the readable RID… id; older links carry the _id.
  const isSelected = (r) => Boolean(selected) && (selected === r.riderId || selected === r._id);
  const active = riders.find(isSelected);
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
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="map-canvas">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {pinned.map((r) => (
                <RiderMarker key={r._id} rider={r} isSelected={isSelected(r)} showLabel={isSelected(r) || pinned.length < 8} onSelect={setSelected} />
              ))}
              <FitOnFirstLoad riders={pinned} />
              <FlyToSelected rider={active} />
              <FitAllButton riders={pinned} />
            </MapContainer>
            <div className="map-legend">
              <span><i style={{ background: 'var(--brand)' }} />On delivery</span>
              <span><i style={{ background: 'var(--info)' }} />Available</span>
            </div>
            <div className="map-updated">
              {paused ? <Pause size={13} /> : <span className="live-dot" />}
              {paused ? 'Paused' : updatedAt ? `Updated ${time(updatedAt, { seconds: true })}` : 'Loading…'}
            </div>
          </div>

          <div className="stack">
            {active && <SelectedRider rider={active} onProfile={() => navigate(`/riders/${active.riderId}`)} />}
            <Card padded={false} className="card-flush">
              <div className="toolbar toolbar-stack">
                <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: riders.length }, { value: 'busy', label: 'Busy', count: count('busy') }, { value: 'available', label: 'Available', count: count('available') }]} />
                <SearchInput value={search} onChange={setSearch} placeholder="Find by name, bike no. or RID id" />
              </div>
              <div className="rider-list">
                {!loading && riders.length === 0 && <EmptyState icon={Bike} title="No riders online" description="Riders appear here as soon as they go online in the rider app." />}
                {riders.length > 0 && shown.length === 0 && <EmptyState icon={Bike} title="No riders match" />}
                {shown.map((r) => (
                  <button type="button" key={r._id} className={`rider-row ${isSelected(r) ? 'is-selected' : ''}`} onClick={() => setSelected(r.riderId)}>
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
            ['Active order', <Link key="o" to={`/orders/${order.orderId}`}><Code copy={false}>{order.orderId}</Code></Link>],
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
