import { EyeOff, Pencil, Store, Trash2 } from 'lucide-react';

import { DataTable } from '@/components/data-table';
import { Drawer } from '@/components/overlays';
import { Badge, Button, Card, Code, EmptyState, ErrorState, KeyValue, StatusBadge } from '@/components/ui';
import { useAuth } from '@/context';
import { useApi } from '@/hooks';
import { paths, useRouter } from '@/router';
import { masterCatalogApi } from '@/services/api';
import { date, money, num } from '@/utils/format';

import { priceRange } from '../catalog-utils';

// ---------------------------------------------------------------------------
// Detail: GET /admin/master-catalog/:id → item + listings (cheapest first)
// ---------------------------------------------------------------------------
export function MasterDetail({ item, editable, onClose, onEdit, onDelete }) {
  const { navigate } = useRouter();
  const { can } = useAuth();
  const { data, loading, error, reload } = useApi(() => masterCatalogApi.get(item._id), [item._id], {
    key: 'master-item',
  });
  const m = data || item;
  const listings = data?.listings;

  const listingColumns = [
    {
      key: 'store',
      header: 'Store',
      render: (l) => (
        <>
          <span className="cell-strong">{l.vendor?.storeName || '—'}</span>
          <span className="cell-sub" style={{ fontFamily: 'var(--mono)' }}>
            {l.productId}
          </span>
        </>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (l) =>
        l.discountPrice ? (
          <>
            <span className="cell-strong">{money(l.discountPrice)}</span>
            <span className="cell-sub" style={{ textDecoration: 'line-through' }}>
              {money(l.price)}
            </span>
          </>
        ) : (
          money(l.price)
        ),
    },
    {
      key: 'stock',
      header: 'Stock',
      align: 'right',
      render: (l) => (l.stock === 0 ? <Badge tone="danger">Out</Badge> : num(l.stock)),
    },
    {
      key: 'status',
      header: 'Status',
      render: (l) =>
        l.isActive === false ? (
          <Badge icon={EyeOff}>Hidden</Badge>
        ) : l.isApproved === false ? (
          <StatusBadge status="pending" />
        ) : (
          <StatusBadge status="active" />
        ),
    },
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      width={620}
      title={m.name}
      subtitle={[m.catalogId, m.brand, m.unit].filter(Boolean).join(' · ')}
      footer={
        editable && (
          <>
            <Button variant="danger-soft" icon={Trash2} onClick={() => onDelete(m)}>
              Delete
            </Button>
            <span className="spacer" />
            <Button icon={Pencil} onClick={() => onEdit(m)}>
              Edit
            </Button>
          </>
        )
      }
    >
      <div className="stack">
        {m.images?.length > 0 && (
          <div className="thumbs" style={{ marginTop: 0 }}>
            {m.images.map((url) => (
              <div className="thumb" key={url}>
                <img src={url} alt="" />
              </div>
            ))}
          </div>
        )}
        <KeyValue
          items={[
            ['Category', m.category?.name],
            ['Status', <StatusBadge key="s" status={m.isActive ? 'active' : 'inactive'} />],
            ['Suggested price', m.suggestedPrice != null ? money(m.suggestedPrice) : null],
            ['Store price range', priceRange(m.priceRange)],
            ['Barcode', m.barcode ? <Code key="b">{m.barcode}</Code> : null],
            ['Stock across stores', m.totalStock != null ? `${num(m.totalStock)} units` : null],
            ['Tags', m.tags?.length ? m.tags.join(', ') : null],
            ['Added', `${date(m.createdAt)}${data?.createdBy?.name ? ` by ${data.createdBy.name}` : ''}`],
          ]}
        />
        {m.description && (
          <p className="muted" style={{ margin: 0 }}>
            {m.description}
          </p>
        )}
        <Card
          title="Store listings"
          subtitle={
            listings
              ? `${num(listings.length)} stores sell this item, cheapest first`
              : 'Stores selling this item'
          }
          padded={false}
          className="table-card"
        >
          {error && !data ? (
            <ErrorState error={error} onRetry={reload} />
          ) : (
            <DataTable
              columns={listingColumns}
              rows={listings}
              loading={loading}
              skeletonRows={3}
              onRowClick={
                can('products') ? (l) => navigate(paths.products({ search: l.productId || '' })) : undefined
              }
              empty={
                <EmptyState
                  icon={Store}
                  title="No store sells this yet"
                  description="Stores can pick it when they add a product."
                />
              }
            />
          )}
        </Card>
      </div>
    </Drawer>
  );
}
