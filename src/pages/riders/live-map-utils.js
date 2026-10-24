// A rider that never shared GPS comes back at { lat: 0, lng: 0 }.
export const hasGps = (r) => Boolean(r.location?.lat || r.location?.lng);

export const riderStatus = (r) => (r.isAvailable ? 'available' : 'busy');

export const PIN_CLASS = { busy: 'is-delivering', available: 'is-idle' };

/**
 * Project real lat/lng onto the stylised CSS map (percent left/top).
 * Take the bounding box of the pinned riders, enforce a minimum size so one
 * rider (or a tight cluster) doesn't zoom in absurdly, then map it into the
 * 10%-90% band so pins never sit on the edge. Axes are scaled independently -
 * good enough for "who is where", not a real map projection.
 */
const MIN_SPAN = 0.02; // degrees, roughly 2 km

export function makeProjection(points) {
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
