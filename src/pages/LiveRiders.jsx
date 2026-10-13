import { useEffect, useState } from 'react';
import { ArrowRight, Bike, Pause, Phone, Play, RefreshCw, Store } from 'lucide-react';
import { useApi } from '../lib/hooks';
import { useQueryState, useRouter } from '../lib/router';
import { adminApi } from '../services/adminApi';
import { money } from '../lib/format';
import { Avatar, Button, Card, EmptyState, KeyValue, PageHeader, SearchInput, Segmented, StatusBadge } from '../ui/primitives';

// Schematic live map. Swap the canvas for Google Maps / Mapbox once the
// /riders/live endpoint returns real lat/lng - the list, filters and polling stay.
const HUBS = [{ name: 'Gulberg Hub', x: 38, y: 42 }, { name: 'Johar Town Hub', x: 22, y: 70 }, { name: 'DHA Hub', x: 74, y: 58 }];
const ZONES = [['Gulberg', 34, 30], ['Model Town', 48, 74], ['Johar Town', 12, 84], ['DHA', 78, 44], ['Bahria Town', 10, 22], ['Cantt', 70, 18]];
const POLL_MS = 8000;

export default function LiveRiders() {
  const { navigate } = useRouter();
  const [selected, setSelected] = useQueryState('rider');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [paused, setPaused] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());
  const { data, loading, reload } = useApi(() => adminApi.getLiveRiders(), []);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => { reload(); setUpdatedAt(Date.now()); }, POLL_MS);
    return () => clearInterval(t);
  }, [paused, reload]);

  const riders = data || [];
  const shown = riders.filter((r) => (filter === 'all' || r.currentStatus === filter) && r.name.toLowerCase().includes(search.toLowerCase()));
  const active = riders.find((r) => r._id === selected);
  const count = (s) => riders.filter((r) => r.currentStatus === s).length;

  return (
    <>
      <PageHeader
        title="Live rider map"
        description="Where every approved rider is right now. Positions refresh automatically every few seconds."
        actions={(
          <>
            <Button variant="secondary" icon={paused ? Play : Pause} onClick={() => setPaused((p) => !p)}>{paused ? 'Resume updates' : 'Pause updates'}</Button>
            <Button variant="secondary" icon={RefreshCw} loading={loading} onClick={() => { reload(); setUpdatedAt(Date.now()); }}>Refresh</Button>
          </>
        )}
      />
      <div className="grid grid-side">
        <div className="map" role="img" aria-label="Rider positions">
          <div className="map-grid" />
          <div className="map-road" style={{ left: 0, right: 0, top: '48%', height: 14 }} />
          <div className="map-road" style={{ top: 0, bottom: 0, left: '56%', width: 14 }} />
          <div className="map-road" style={{ left: '10%', right: '30%', top: '22%', height: 8, transform: 'rotate(12deg)' }} />
          {ZONES.map(([name, x, y]) => <span key={name} className="map-zone" style={{ left: `${x}%`, top: `${y}%` }}>{name}</span>)}
          {HUBS.map((h) => <span key={h.name} className="map-hub" style={{ left: `${h.x}%`, top: `${h.y}%` }} title={h.name}><Store size={15} /></span>)}
          {shown.map((r) => (
            <button
              type="button"
              key={r._id}
              className={`map-pin is-${r.currentStatus} ${selected === r._id ? 'is-selected' : ''}`}
              style={{ left: `${r.location.x}%`, top: `${r.location.y}%` }}
              onClick={() => setSelected(r._id)}
              aria-label={r.name}
            >
              <span className="map-pin-dot"><Bike size={14} /></span>
              {(selected === r._id || shown.length < 8) && <span className="map-pin-label">{r.name.split(' ')[0]}</span>}
            </button>
          ))}
          <div className="map-legend">
            <span><i style={{ background: 'var(--brand)' }} />On delivery</span>
            <span><i style={{ background: 'var(--info)' }} />Idle</span>
            <span><i style={{ background: 'var(--text-3)' }} />Offline</span>
          </div>
          <div className="map-updated">{paused ? <Pause size={13} /> : <span className="live-dot" />} {paused ? 'Paused' : `Updated ${new Date(updatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}</div>
        </div>

        <div className="stack">
          {active && (
            <Card title={active.name} subtitle={`${active.riderId} · ${active.zone}`} action={<StatusBadge status={active.currentStatus} />}>
              <KeyValue items={[['Phone', active.phone], ['Vehicle', active.vehicleNumber], ['COD in hand', money(active.codInHand)], ['Last ping', `${active.location.lastPingSec}s ago`]]} />
              <div className="row" style={{ marginTop: 16 }}>
                <Button variant="secondary" size="sm" icon={Phone} onClick={() => { window.location.href = `tel:${active.phone.replace(/\s/g, '')}`; }}>Call</Button>
                <Button variant="soft" size="sm" iconRight={ArrowRight} onClick={() => navigate(`/riders/${active.riderId}`)}>Full profile</Button>
              </div>
            </Card>
          )}
          <Card padded={false} className="card-flush">
            <div className="toolbar toolbar-stack">
              <Segmented value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All', count: riders.length }, { value: 'delivering', label: 'Busy', count: count('delivering') }, { value: 'idle', label: 'Idle', count: count('idle') }, { value: 'offline', label: 'Off', count: count('offline') }]} />
              <SearchInput value={search} onChange={setSearch} placeholder="Find a rider" />
            </div>
            <div className="rider-list">
              {shown.length === 0 && <EmptyState icon={Bike} title="No riders match" />}
              {shown.map((r) => (
                <button type="button" key={r._id} className={`rider-row ${selected === r._id ? 'is-selected' : ''}`} onClick={() => setSelected(r._id)}>
                  <Avatar name={r.name} size="sm" />
                  <div className="identity-copy" style={{ flex: 1 }}>
                    <strong>{r.name}</strong>
                    <small>{r.zone} · {r.vehicleNumber}</small>
                  </div>
                  <StatusBadge status={r.currentStatus} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
