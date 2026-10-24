import { Card, EmptyState, ErrorState, Skeleton } from '@/components/ui';

// Loading / error / empty wrapper for report tabs that render charts rather than a table.
export function ReportState({ query, isEmpty, children }) {
  if (query.error && !query.data)
    return (
      <Card>
        <ErrorState error={query.error} onRetry={query.reload} />
      </Card>
    );
  if (!query.data) return <Skeleton h={420} r={16} />;
  if (isEmpty?.(query.data))
    return (
      <Card>
        <EmptyState
          title="No delivered orders"
          description="Nothing was delivered in this date range. Try a wider range."
        />
      </Card>
    );
  return children(query.data);
}
