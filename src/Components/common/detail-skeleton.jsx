import { Skeleton } from '@/components/ui';

export function DetailSkeleton() {
  return (
    <div className="stack">
      <Skeleton w={120} />
      <div className="card card-padded">
        <div className="row">
          <Skeleton w={64} h={64} r={18} />
          <div style={{ flex: 1, display: 'grid', gap: 8 }}>
            <Skeleton w="40%" h={20} />
            <Skeleton w="60%" />
          </div>
        </div>
      </div>
      <div className="grid grid-side">
        <Skeleton h={320} r={16} />
        <Skeleton h={320} r={16} />
      </div>
    </div>
  );
}
