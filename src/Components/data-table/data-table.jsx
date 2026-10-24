import { ArrowDown, ArrowUp } from 'lucide-react';

import { EmptyState, ErrorState, Skeleton } from '@/components/ui';

// columns: [{ key, header, render?(row), align?, width?, sortable?, hideOnMobile? }]
export function DataTable({
  columns,
  rows,
  loading,
  error,
  onRetry,
  onRowClick,
  rowKey = '_id',
  empty,
  sort,
  onSort,
  rowClassName,
  skeletonRows = 6,
}) {
  const showSkeleton = loading && !rows?.length;
  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort && sort.replace('-', '') === c.sortKey;
              return (
                <th
                  key={c.key}
                  style={{ width: c.width, textAlign: c.align }}
                  className={c.hideOnMobile ? 'hide-sm' : undefined}
                >
                  {c.sortable && onSort ? (
                    <button
                      type="button"
                      className={`th-sort ${active ? 'is-active' : ''}`}
                      onClick={() => onSort(active && !sort.startsWith('-') ? `-${c.sortKey}` : c.sortKey)}
                    >
                      {c.header}
                      {active && (sort.startsWith('-') ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={loading && rows?.length ? 'is-refreshing' : undefined}>
          {showSkeleton &&
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk${i}`} className="sk-row">
                {columns.map((c, j) => (
                  <td key={c.key} className={c.hideOnMobile ? 'hide-sm' : undefined}>
                    <Skeleton w={j === 0 ? '70%' : `${40 + ((i * 7 + j * 13) % 45)}%`} />
                  </td>
                ))}
              </tr>
            ))}
          {!loading && error && !rows?.length && (
            <tr>
              <td colSpan={columns.length}>
                <ErrorState error={error} onRetry={onRetry} />
              </td>
            </tr>
          )}
          {!showSkeleton && !error && rows?.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                {empty || (
                  <EmptyState title="No results" description="Try a different search or clear the filters." />
                )}
              </td>
            </tr>
          )}
          {rows?.map((row) => (
            <tr
              key={typeof rowKey === 'function' ? rowKey(row) : row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={[onRowClick && 'is-clickable', rowClassName?.(row)].filter(Boolean).join(' ')}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  data-label={typeof c.header === 'string' ? c.header : ''}
                  style={{ textAlign: c.align }}
                  className={
                    [c.hideOnMobile && 'hide-sm', c.key === 'actions' && 'td-actions']
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
