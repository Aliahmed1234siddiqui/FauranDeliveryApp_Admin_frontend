import { useState } from 'react';
import { Package } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { Badge, Card, EmptyState, Identity, Progress, SearchInput, Segmented } from '@/components/ui';
import { num } from '@/utils/format';

// Out-of-stock and low-stock lists (not paged). Out-of-stock rows carry no productId.
export function StockTable({ data, loading, error, onRetry, onOpen }) {
  const [tab, setTab] = useState('low');
  const [search, setSearch] = useState('');
  const threshold = data?.threshold || 1;
  const all = data?.[tab === 'low' ? 'lowStock' : 'outOfStock'];
  const term = search.trim().toLowerCase();
  const rows = all?.filter(
    (p) =>
      !term ||
      p.name?.toLowerCase().includes(term) ||
      p.vendor?.storeName?.toLowerCase().includes(term) ||
      p.productId?.toLowerCase().includes(term),
  );

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (p) => (
        <Identity name={p.name} sub={[p.unit, p.productId].filter(Boolean).join(' · ') || undefined} />
      ),
    },
    {
      key: 'vendor',
      header: 'Store',
      hideOnMobile: true,
      render: (p) => (
        <>
          <span className="cell-strong">{p.vendor?.storeName || '—'}</span>
          <span className="cell-sub">{p.vendor?.vendorId}</span>
        </>
      ),
    },
    {
      key: 'level',
      header: 'Stock level',
      width: 220,
      render: (p) => (
        <div style={{ minWidth: 140 }}>
          <div className="row" style={{ justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
            <strong style={{ color: 'var(--text)' }}>{num(p.stock)} units</strong>
            <span className="muted">alert at {num(threshold)}</span>
          </div>
          <Progress value={p.stock} max={threshold} tone={p.stock === 0 ? 'danger' : 'warning'} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) =>
        p.stock === 0 ? (
          <Badge tone="danger" dot>
            Out of stock
          </Badge>
        ) : (
          <Badge tone="warning" dot>
            Low
          </Badge>
        ),
    },
  ];

  return (
    <Card className="table-card" padded={false}>
      <div className="toolbar">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'low', label: 'Low stock', count: data?.lowStock?.length },
            { value: 'out', label: 'Out of stock', count: data?.outOfStock?.length },
          ]}
        />
        <div className="spacer" />
        <SearchInput value={search} onChange={setSearch} placeholder="Product or store" />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onRowClick={onOpen}
        empty={
          <EmptyState
            icon={Package}
            title={
              term ? 'Nothing matches' : tab === 'low' ? 'No low-stock products' : 'Nothing is out of stock'
            }
            description={term ? 'Try another search.' : 'Every listing is above the alert level.'}
          />
        }
      />
    </Card>
  );
}
