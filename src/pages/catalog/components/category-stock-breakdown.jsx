import { Tags } from 'lucide-react';

import { EmptyState, Progress, Skeleton } from '@/components/ui';
import { num } from '@/utils/format';

export function CategoryBreakdown({ rows }) {
  if (!rows) return <Skeleton h={200} />;
  if (!rows.length) return <EmptyState icon={Tags} title="No categories with stock" />;
  const most = Math.max(1, ...rows.map((c) => c.units));
  return (
    <div className="list">
      {rows.map((c) => (
        <div key={c.categoryId} className="list-item" style={{ display: 'block' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ fontSize: 13.5 }}>{c.name || 'Uncategorised'}</strong>
            <span className="muted" style={{ fontSize: 12 }}>
              {num(c.products)} products · {num(c.units)} units
            </span>
          </div>
          <Progress value={c.units} max={most} />
        </div>
      ))}
    </div>
  );
}
