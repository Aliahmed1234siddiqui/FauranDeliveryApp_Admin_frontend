import { useEffect, useState } from 'react';
import { Bike, Pause, Play, RefreshCw } from 'lucide-react';

import {
  Avatar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  SearchInput,
  Segmented,
  StatusBadge,
} from '@/components/ui';
import { useApi } from '@/hooks';
import { paths, useQueryState, useRouter } from '@/router';
import { ridersApi } from '@/services/api';
import { useSocketEvent } from '@/services/socket';

import { SelectedRider } from './components/selected-rider-card';
import { hasGps, makeProjection, PIN_CLASS, riderStatus } from './live-map-utils';

// The deployed backend can't hold Socket.IO connections, so socket events may
// never arrive. We still listen for them, and also re-fetch the list on a timer.
const POLL_MS = 15000;

export default function LiveRiders() {
  const { navigate } = useRouter();
  const [selected, setSelected] = useQueryState('rider');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [paused, setPaused] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const { data, loading, error, reload, setData } = useApi(
    () =>
      ridersApi.live().then((rows) => {
        setUpdatedAt(Date.now());
        return rows;
      }),
    [],
    { key: 'live-riders', staleTime: 0 },
  );

  // Polling fallback for when the socket is unavailable.
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [paused, reload]);

  // Live position pushes. Riders not in the list yet arrive via rider:status / the next poll.
  useSocketEvent('rider:live_location', ({ riderId, lat, lng, isAvailable }) => {
    if (paused) return;
    setData((rows) =>
      rows?.map((r) =>
        r._id === riderId
          ? { ...r, location: { lat, lng }, isAvailable, lastSeen: new Date().toISOString() }
          : r,
      ),
    );
    setUpdatedAt(Date.now());
  });

  // Coming online needs the full row (activeOrder etc.), so re-fetch; going offline just drops the rider.
  useSocketEvent('rider:status', ({ riderId, isOnline }) => {
    if (isOnline) reload();
    else setData((rows) => rows?.filter((r) => r._id !== riderId));
  });

  const riders = data || [];
  const q = search.trim().toLowerCase();
  const shown = riders.filter(
    (r) =>
      (filter === 'all' || riderStatus(r) === filter) &&
      [r.name, r.riderId, r.vehicleNumber].some((s) => s?.toLowerCase().includes(q)),
  );
  const pinned = shown.filter(hasGps);
  const project = makeProjection(pinned.map((r) => r.location));
  const active = riders.find((r) => r._id === selected);
  const count = (s) => riders.filter((r) => riderStatus(r) === s).length;

  return (
    <>
      <PageHeader
        title="Live rider map"
        description="Where every online rider is right now. Positions update live and refresh every 15 seconds."
        actions={
          <>
            <Button variant="secondary" icon={paused ? Play : Pause} onClick={() => setPaused((p) => !p)}>
              {paused ? 'Resume updates' : 'Pause updates'}
            </Button>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={reload}>
              Refresh
            </Button>
          </>
        }
      />
      {error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : (
        <div className="grid grid-side">
          <div className="map" role="img" aria-label="Rider positions">
            <div className="map-grid" />
            <div className="map-road" style={{ left: 0, right: 0, top: '48%', height: 14 }} />
            <div className="map-road" style={{ top: 0, bottom: 0, left: '56%', width: 14 }} />
            <div
              className="map-road"
              style={{ left: '10%', right: '30%', top: '22%', height: 8, transform: 'rotate(12deg)' }}
            />
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
                  <span className="map-pin-dot">
                    <Bike size={14} />
                  </span>
                  {(selected === r._id || pinned.length < 8) && (
                    <span className="map-pin-label">{r.name.split(' ')[0]}</span>
                  )}
                </button>
              );
            })}
            <div className="map-legend">
              <span>
                <i style={{ background: 'var(--brand)' }} />
                On delivery
              </span>
              <span>
                <i style={{ background: 'var(--info)' }} />
                Available
              </span>
            </div>
            <div className="map-updated">
              {paused ? <Pause size={13} /> : <span className="live-dot" />}
              {paused
                ? 'Paused'
                : updatedAt
                  ? `Updated ${new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                  : 'Loading…'}
            </div>
          </div>

          <div className="stack">
            {active && (
              <SelectedRider rider={active} onProfile={() => navigate(paths.rider(active.riderId))} />
            )}
            <Card padded={false} className="card-flush">
              <div className="toolbar toolbar-stack">
                <Segmented
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: 'all', label: 'All', count: riders.length },
                    { value: 'busy', label: 'Busy', count: count('busy') },
                    { value: 'available', label: 'Available', count: count('available') },
                  ]}
                />
                <SearchInput value={search} onChange={setSearch} placeholder="Find a rider" />
              </div>
              <div className="rider-list">
                {!loading && riders.length === 0 && (
                  <EmptyState
                    icon={Bike}
                    title="No riders online"
                    description="Riders appear here as soon as they go online in the rider app."
                  />
                )}
                {riders.length > 0 && shown.length === 0 && (
                  <EmptyState icon={Bike} title="No riders match" />
                )}
                {shown.map((r) => (
                  <button
                    type="button"
                    key={r._id}
                    className={`rider-row ${selected === r._id ? 'is-selected' : ''}`}
                    onClick={() => setSelected(r._id)}
                  >
                    <Avatar name={r.name} size="sm" />
                    <div className="identity-copy" style={{ flex: 1 }}>
                      <strong>{r.name}</strong>
                      <small>
                        {r.vehicleNumber || r.riderId}
                        {hasGps(r) ? '' : ' · No GPS yet'}
                      </small>
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
