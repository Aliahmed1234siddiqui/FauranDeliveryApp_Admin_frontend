import { Skeleton } from '@/components/ui';

export const StatSkeletons = ({ count }) =>
  Array.from({ length: count }).map((_, i) => (
    <div className="stat-card" key={i}>
      <Skeleton w={38} h={38} r={11} />
      <div style={{ height: 14 }} />
      <Skeleton w="50%" />
      <div style={{ height: 8 }} />
      <Skeleton w="70%" h={26} />
    </div>
  ));
