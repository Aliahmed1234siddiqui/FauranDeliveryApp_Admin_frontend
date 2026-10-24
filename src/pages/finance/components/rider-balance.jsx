import { Badge } from '@/components/ui';
import { money } from '@/utils/format';

export function RiderBalance({ r }) {
  if (r.furanOwesRider > 0)
    return <span className="cell-strong pos">Fauran Mart owes {money(r.furanOwesRider)}</span>;
  if (r.riderOwesFuran > 0) return <Badge tone="danger">Rider owes {money(r.riderOwesFuran)}</Badge>;
  return <span className="muted">Settled</span>;
}
