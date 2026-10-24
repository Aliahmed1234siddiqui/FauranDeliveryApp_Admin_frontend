import { BarList } from '@/components/charts';
import { Card, EmptyState } from '@/components/ui';
import { num } from '@/utils/format';

export function RankCard({ title, subtitle, rows, onItemClick, toItem }) {
  return (
    <Card title={title} subtitle={subtitle}>
      {rows.length ? (
        <BarList items={rows.slice(0, 5).map(toItem)} format={num} onItemClick={onItemClick} />
      ) : (
        <EmptyState title="No activity yet" description="Rankings appear once orders are delivered." />
      )}
    </Card>
  );
}
